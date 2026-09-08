'use strict';

const { createStore } = require('../../src/store');
const { createBooking } = require('../../src/bookings');
const { freeSlots } = require('../../src/availability');
const { staticHolidayCalendar } = require('../../src/holidays');

const now = new Date('2026-10-12T09:00:00Z');

describe('freeSlots', () => {
  test('offers twenty half-hour slots on an empty day', async () => {
    const slots = await freeSlots(createStore(), 'atlas', '2026-10-13');
    expect(slots).toHaveLength(20);
    expect(slots[0].start).toBe('2026-10-13T08:00:00.000Z');
    expect(slots[19].end).toBe('2026-10-13T18:00:00.000Z');
  });

  test('removes slots covered by a booking', async () => {
    const store = createStore();
    createBooking(store, { roomId: 'atlas', organizer: 'o', start: '2026-10-13T09:00:00Z', end: '2026-10-13T10:30:00Z' }, { now });
    const starts = (await freeSlots(store, 'atlas', '2026-10-13')).map((s) => s.start.slice(11, 16));
    expect(starts).not.toContain('09:00');
    expect(starts).not.toContain('10:00');
    expect(starts).toContain('10:30');
  });

  test('ignores bookings in other rooms', async () => {
    const store = createStore();
    createBooking(store, { roomId: 'birch', organizer: 'o', start: '2026-10-13T09:00:00Z', end: '2026-10-13T10:00:00Z' }, { now });
    expect(await freeSlots(store, 'atlas', '2026-10-13')).toHaveLength(20);
  });

  test('skips public holidays', async () => {
    const holidays = staticHolidayCalendar(['2026-12-25']);
    expect(await freeSlots(createStore(), 'atlas', '2026-12-25', { holidays })).toEqual([]);
    expect(await freeSlots(createStore(), 'atlas', '2026-12-23', { holidays })).toHaveLength(20);
  });
});
