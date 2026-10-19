'use strict';

const { createStore } = require('./store');
const { createBooking, rescheduleBooking, cancelBooking, ValidationError } = require('./bookings');
const { freeSlots } = require('./availability');
const { quote } = require('./pricing');
const { parseInstant, isDateString } = require('./time');
const { bookingToICal } = require('./export/ical');

function createApp({ store = createStore(), holidays = null, clock = () => new Date() } = {}) {
  const routes = [];
  const route = (method, pattern, handler) => {
    const keys = [];
    const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}$`);
    routes.push({ method, re, keys, handler });
  };

  route('GET', '/health', () => ({ status: 200, body: { ok: true } }));

  route('GET', '/rooms', ({ query }) => {
    const min = query.get('minCapacity') ? Number(query.get('minCapacity')) : 0;
    const rooms = store.listRooms()
      .filter((r) => r.capacity >= min)
      .sort((a, b) => b.capacity - a.capacity || a.id.localeCompare(b.id));
    return { status: 200, body: rooms };
  });

  route('GET', '/rooms/:id', ({ params }) => {
    const room = store.getRoom(params.id);
    return room ? { status: 200, body: room } : notFound('room');
  });

  route('GET', '/rooms/:id/bookings', ({ params }) => {
    if (!store.getRoom(params.id)) return notFound('room');
    return { status: 200, body: store.bookingsForRoom(params.id) };
  });

  route('GET', '/rooms/:id/availability', async ({ params, query }) => {
    if (!store.getRoom(params.id)) return notFound('room');
    const date = query.get('date');
    if (!isDateString(date)) return { status: 400, body: { error: 'date must be YYYY-MM-DD' } };
    return { status: 200, body: { roomId: params.id, date, slots: await freeSlots(store, params.id, date, { holidays }) } };
  });

  route('GET', '/rooms/:id/quote', ({ params, query }) => {
    const room = store.getRoom(params.id);
    if (!room) return notFound('room');
    const start = parseInstant(query.get('start'));
    const end = parseInstant(query.get('end'));
    if (!start || !end || end <= start) return { status: 400, body: { error: 'valid start and end are required' } };
    return { status: 200, body: quote(room, start, end, { member: query.get('member') === 'true' }) };
  });

  route('POST', '/bookings', ({ body }) => {
    const booking = createBooking(store, body, { now: clock() });
    return { status: 201, body: booking };
  });

  route('GET', '/bookings/:id', ({ params }) => {
    const booking = store.getBooking(params.id);
    return booking ? { status: 200, body: booking } : notFound('booking');
  });

  route('GET', '/bookings/:id/ical', ({ params }) => {
    const booking = store.getBooking(params.id);
    if (!booking) return notFound('booking');
    return { status: 200, type: 'text/calendar', body: bookingToICal(booking, store.getRoom(booking.roomId)) };
  });

  route('PATCH', '/bookings/:id', ({ params, body }) => ({
    status: 200,
    body: rescheduleBooking(store, params.id, body, { now: clock() }),
  }));

  route('DELETE', '/bookings/:id', ({ params }) => ({
    status: 200,
    body: cancelBooking(store, params.id, { now: clock() }),
  }));

  async function handle(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const match = routes
      .filter((r) => r.method === req.method)
      .map((r) => ({ r, m: r.re.exec(url.pathname) }))
      .find((x) => x.m);
    let result;
    try {
      if (!match) {
        result = notFound('route');
      } else {
        const params = Object.fromEntries(match.r.keys.map((k, i) => [k, decodeURIComponent(match.m[i + 1])]));
        const body = ['POST', 'PATCH'].includes(req.method) ? await readJson(req) : {};
        result = await match.r.handler({ params, query: url.searchParams, body });
      }
    } catch (err) {
      if (err instanceof ValidationError) result = { status: err.status, body: { error: err.message } };
      else if (err instanceof SyntaxError) result = { status: 400, body: { error: 'invalid JSON body' } };
      else result = { status: 500, body: { error: 'internal error' } };
    }
    send(res, result);
  }

  handle.store = store;
  return handle;
}

function notFound(what) {
  return { status: 404, body: { error: `${what} not found` } };
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function send(res, { status, body, type = 'application/json' }) {
  if (body === undefined) {
    res.writeHead(status);
    res.end();
    return;
  }
  const payload = type === 'application/json' ? JSON.stringify(body) : body;
  res.writeHead(status, { 'content-type': type });
  res.end(payload);
}

module.exports = { createApp };
