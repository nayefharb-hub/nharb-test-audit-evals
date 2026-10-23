'use strict';

const { createStore } = require('../../src/store');
const { createHoldManager } = require('../../src/holds');

const range = (s, e) => [new Date(`2026-10-13T${s}:00Z`), new Date(`2026-10-13T${e}:00Z`)];

describe('hold manager', () => {
  test('places a hold with an expiry', () => {
    const holds = createHoldManager(createStore(), { ttlMs: 60_000 });
    const h = holds.place('atlas', ...range('10:00', '11:00'), 'ana');
    expect(h).toMatchObject({ roomId: 'atlas', owner: 'ana' });
    expect(new Date(h.expiresAt).getTime()).toBeGreaterThan(Date.now());
    holds.clear();
  });

  test('refuses an overlapping hold on the same room', () => {
    const holds = createHoldManager(createStore(), { ttlMs: 60_000 });
    holds.place('atlas', ...range('10:00', '11:00'), 'ana');
    expect(() => holds.place('atlas', ...range('10:30', '11:30'), 'ben')).toThrow(/held/);
    holds.clear();
  });

  test('emits released when a hold is cancelled', () => {
    const holds = createHoldManager(createStore(), { ttlMs: 60_000 });
    const h = holds.place('atlas', ...range('10:00', '11:00'), 'ana');
    const seen = [];
    holds.events.on('released', (e) => seen.push(e));
    holds.release(h.id, 'cancelled');
    expect(seen).toEqual([{ id: h.id, reason: 'cancelled' }]);
  });
});
