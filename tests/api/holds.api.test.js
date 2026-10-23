'use strict';

const { startServer } = require('../helpers/server');

// Holds expire on a real timer, so these tests use a short TTL and wait it out.
const TTL = 800;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let srv;
beforeEach(async () => { srv = await startServer({ holdTtlMs: TTL }); });
afterEach(() => srv.close());

const slot = { roomId: 'birch', start: '2026-10-13T10:00:00Z', end: '2026-10-13T11:00:00Z' };

describe('holds', () => {
  test('a hold blocks bookings by others', async () => {
    const hold = await srv.post('/holds', { ...slot, owner: 'ana' });
    expect(hold.status).toBe(201);
    const res = await srv.post('/bookings', { ...slot, organizer: 'ben' });
    expect(res.status).toBe(409);
  });

  test('booking with the hold id confirms it', async () => {
    const { body: hold } = await srv.post('/holds', { ...slot, owner: 'ana' });
    const res = await srv.post('/bookings', { ...slot, organizer: 'ana', holdId: hold.id });
    expect(res.status).toBe(201);
    expect((await srv.get(`/holds/${hold.id}`)).status).toBe(404);
  });

  test('a hold is still active before its ttl', async () => {
    const { body: hold } = await srv.post('/holds', { ...slot, owner: 'ana' });
    await wait(TTL / 2);
    expect((await srv.get(`/holds/${hold.id}`)).status).toBe(200);
  });

  test('releases a hold once its ttl has passed', async () => {
    const { body: hold } = await srv.post('/holds', { ...slot, owner: 'ana' });
    await wait(TTL + 300);
    expect((await srv.get(`/holds/${hold.id}`)).status).toBe(404);
  });

  test('an expired hold no longer blocks bookings', async () => {
    await srv.post('/holds', { ...slot, owner: 'ana' });
    await wait(TTL + 300);
    const res = await srv.post('/bookings', { ...slot, organizer: 'ben' });
    expect(res.status).toBe(201);
  });

  test('a hold can be cancelled', async () => {
    const { body: hold } = await srv.post('/holds', { ...slot, owner: 'ana' });
    expect((await srv.del(`/holds/${hold.id}`)).status).toBe(204);
  });
});
