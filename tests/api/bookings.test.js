'use strict';

const { startServer } = require('../helpers/server');

let srv;
beforeEach(async () => { srv = await startServer(); });
afterEach(() => srv.close());

const booking = (overrides = {}) => ({
  roomId: 'atlas',
  organizer: 'ana@example.com',
  attendees: 5,
  start: '2026-10-13T10:00:00Z',
  end: '2026-10-13T11:00:00Z',
  ...overrides,
});

describe('POST /bookings', () => {
  test('creates a booking', async () => {
    const res = await srv.post('/bookings', booking());
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ roomId: 'atlas', status: 'confirmed' });
  });

  test('returns 409 when the room is taken', async () => {
    await srv.post('/bookings', booking());
    const res = await srv.post('/bookings', booking({ start: '2026-10-13T10:30:00Z', end: '2026-10-13T11:30:00Z' }));
    expect(res.status).toBe(409);
  });

  test('rejects bookings that start in the past', async () => {
    const res = await srv.post('/bookings', booking({ start: '2026-10-12T13:00:00Z', end: '2026-10-12T14:00:00Z' }));
    expect(res.status).toBe(422);
  });

  test('returns 400 for a malformed body', async () => {
    const res = await fetch(`${srv.base}/bookings`, { method: 'POST', body: '{"roomId":', headers: { 'content-type': 'application/json' } });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /bookings/:id', () => {
  test('reschedules into a free slot', async () => {
    const { body: b } = await srv.post('/bookings', booking());
    const res = await srv.patch(`/bookings/${b.id}`, { start: '2026-10-13T15:00:00Z', end: '2026-10-13T16:00:00Z' });
    expect(res.status).toBe(200);
    expect(res.body.start).toBe('2026-10-13T15:00:00.000Z');
  });

  test('rejects a reschedule longer than four hours', async () => {
    const { body: b } = await srv.post('/bookings', booking());
    const res = await srv.patch(`/bookings/${b.id}`, { start: '2026-10-13T09:00:00Z', end: '2026-10-13T15:00:00Z' });
    expect(res.status).toBe(422);
  });
});

describe('DELETE /bookings/:id', () => {
  test('cancels a booking', async () => {
    const { body: b } = await srv.post('/bookings', booking());
    const res = await srv.del(`/bookings/${b.id}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
    expect((await srv.get('/rooms/atlas/bookings')).body).toEqual([]);
  });

  test('returns 404 for an unknown booking', async () => {
    expect((await srv.del('/bookings/bk_99999')).status).toBe(404);
  });
});

describe('GET /bookings/:id/ical', () => {
  test('serves a calendar file', async () => {
    const { body: b } = await srv.post('/bookings', booking());
    const res = await srv.get(`/bookings/${b.id}/ical`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/calendar');
    expect(res.body).toContain(`UID:${b.id}@roombook`);
  });
});
