'use strict';

const { startServer } = require('../helpers/server');

let srv;
beforeAll(async () => { srv = await startServer(); });
afterAll(() => srv.close());

describe('GET /rooms', () => {
  test('orders rooms by capacity, largest first', async () => {
    const res = await srv.get('/rooms');
    expect(res.status).toBe(200);
    expect(res.body.map((r) => r.id)).toEqual(['dune', 'atlas', 'birch', 'cedar']);
  });

  test('filters by minimum capacity', async () => {
    const res = await srv.get('/rooms?minCapacity=10');
    expect(res.body.map((r) => r.id)).toEqual(['dune', 'atlas']);
  });

  test('returns 404 for an unknown room', async () => {
    const res = await srv.get('/rooms/zephyr');
    expect(res.status).toBe(404);
  });
});

describe('GET /rooms/:id/quote', () => {
  test('quotes a two hour booking', async () => {
    const res = await srv.get('/rooms/atlas/quote?start=2026-10-13T10:00:00Z&end=2026-10-13T12:00:00Z');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 80, currency: 'EUR' });
  });
});
