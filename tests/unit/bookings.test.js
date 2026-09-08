'use strict';

const { createStore } = require('../../src/store');
const { createBooking, rescheduleBooking, cancelBooking, overlaps } = require('../../src/bookings');

const now = new Date('2026-10-12T09:00:00Z');
const base = { roomId: 'birch', organizer: 'ana@example.com', attendees: 4 };

function book(store, start, end, extra = {}) {
  return createBooking(store, { ...base, start, end, ...extra }, { now });
}

describe('overlaps', () => {
  test('detects partially overlapping ranges', () => {
    expect(overlaps({ start: 0, end: 10 }, { start: 5, end: 15 })).toBe(true);
  });
});

describe('createBooking', () => {
  test('creates a confirmed booking', () => {
    const store = createStore();
    const b = book(store, '2026-10-13T10:00:00Z', '2026-10-13T11:00:00Z');
    expect(b).toMatchObject({ roomId: 'birch', status: 'confirmed', attendees: 4 });
    expect(store.getBooking(b.id)).toBe(b);
  });

  test('rejects a booking that clashes with an existing one', () => {
    const store = createStore();
    book(store, '2026-10-13T10:00:00Z', '2026-10-13T11:00:00Z');
    expect(() => book(store, '2026-10-13T10:30:00Z', '2026-10-13T11:30:00Z')).toThrow(/already booked/);
  });

  test('allows a booking that starts when another ends', () => {
    const store = createStore();
    book(store, '2026-10-13T10:00:00Z', '2026-10-13T11:00:00Z');
    expect(() => book(store, '2026-10-13T11:00:00Z', '2026-10-13T12:00:00Z')).not.toThrow();
  });

  test('rejects more attendees than the room holds', () => {
    const store = createStore();
    expect(() => book(store, '2026-10-13T10:00:00Z', '2026-10-13T11:00:00Z', { attendees: 7 })).toThrow(/capacity is 6/);
  });

  test('rejects bookings longer than four hours', () => {
    const store = createStore();
    expect(() => book(store, '2026-10-13T08:00:00Z', '2026-10-13T12:30:00Z')).toThrow(/4 hours/);
  });

  test('rejects timestamps without an offset', () => {
    const store = createStore();
    expect(() => book(store, '2026-10-13T10:00:00', '2026-10-13T11:00:00')).toThrow(/ISO-8601/);
  });
});

describe('rescheduleBooking', () => {
  test('moves a booking to a free slot', () => {
    const store = createStore();
    const b = book(store, '2026-10-13T10:00:00Z', '2026-10-13T11:00:00Z');
    const moved = rescheduleBooking(store, b.id, { start: '2026-10-13T14:00:00Z', end: '2026-10-13T15:00:00Z' }, { now });
    expect(moved.start).toBe('2026-10-13T14:00:00.000Z');
  });
});

describe('cancelBooking', () => {
  test('refuses to cancel within an hour of the start', () => {
    const store = createStore();
    const b = book(store, '2026-10-12T09:30:00Z', '2026-10-12T10:30:00Z');
    expect(() => cancelBooking(store, b.id, { now })).toThrow(/one hour/);
  });
});
