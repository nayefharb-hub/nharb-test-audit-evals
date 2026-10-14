'use strict';

const { startServer } = require('../helpers/server');

let srv;
beforeAll(async () => { srv = await startServer(); });
afterAll(() => srv.close());

describe('GET /rooms/:id/availability', () => {
  test('lists free slots for a working day', async () => {
    await srv.post('/bookings', { roomId: 'cedar', organizer: 'o', start: '2026-10-14T08:00:00Z', end: '2026-10-14T09:00:00Z' });
    const res = await srv.get('/rooms/cedar/availability?date=2026-10-14');
    expect(res.status).toBe(200);
    expect(res.body.slots).toHaveLength(18);
    expect(res.body.slots[0].start).toBe('2026-10-14T09:00:00.000Z');
  });

  test('returns no slots on a public holiday', async () => {
    const res = await srv.get('/rooms/cedar/availability?date=2026-12-25');
    expect(res.body.slots).toEqual([]);
  });

  test('returns 400 for a malformed date', async () => {
    const res = await srv.get('/rooms/cedar/availability?date=14-10-2026');
    expect(res.status).toBe(400);
  });
});
