'use strict';

const { parseInstant, minutesBetween, startOfDayUTC, HOUR } = require('./time');

const MAX_DURATION_MINUTES = 4 * 60;
const MIN_DURATION_MINUTES = 15;

class ValidationError extends Error {
  constructor(message, status = 422) {
    super(message);
    this.status = status;
  }
}

function overlaps(a, b) {
  return a.start < b.end && b.start < a.end;
}

function toRange(booking) {
  return { start: new Date(booking.start).getTime(), end: new Date(booking.end).getTime() };
}

function checkTimes(startRaw, endRaw, now) {
  const start = parseInstant(startRaw);
  const end = parseInstant(endRaw);
  if (!start || !end) throw new ValidationError('start and end must be ISO-8601 timestamps with an offset');
  if (end <= start) throw new ValidationError('end must be after start');
  if (start < startOfDayUTC(now)) throw new ValidationError('start must not be in the past');
  const minutes = minutesBetween(start, end);
  if (minutes < MIN_DURATION_MINUTES) throw new ValidationError(`bookings must be at least ${MIN_DURATION_MINUTES} minutes`);
  return { start, end, minutes };
}

function assertFree(store, roomId, range, ignoreId) {
  const clash = store.bookingsForRoom(roomId)
    .filter((b) => b.id !== ignoreId)
    .find((b) => overlaps(range, toRange(b)));
  if (clash) throw new ValidationError(`room is already booked (${clash.id})`, 409);
}

function createBooking(store, input, { now } = {}) {
  const room = store.getRoom(input.roomId);
  if (!room) throw new ValidationError('unknown room', 404);
  const { start, end, minutes } = checkTimes(input.start, input.end, now);
  if (minutes > MAX_DURATION_MINUTES) throw new ValidationError('bookings may not exceed 4 hours');

  const attendees = Number(input.attendees || 1);
  if (!Number.isInteger(attendees) || attendees < 1) throw new ValidationError('attendees must be a positive integer');
  if (attendees > room.capacity) throw new ValidationError(`room capacity is ${room.capacity}`);
  if (!input.organizer || typeof input.organizer !== 'string') throw new ValidationError('organizer is required');

  const range = { start: start.getTime(), end: end.getTime() };
  assertFree(store, room.id, range);

  return store.saveBooking({
    id: store.nextId('bk'),
    roomId: room.id,
    start: start.toISOString(),
    end: end.toISOString(),
    attendees,
    organizer: input.organizer,
    title: input.title || '',
    status: 'confirmed',
  });
}

function rescheduleBooking(store, id, input, { now } = {}) {
  const booking = store.getBooking(id);
  if (!booking || booking.status === 'cancelled') throw new ValidationError('booking not found', 404);
  const { start, end } = checkTimes(input.start || booking.start, input.end || booking.end, now);
  assertFree(store, booking.roomId, { start: start.getTime(), end: end.getTime() }, booking.id);
  booking.start = start.toISOString();
  booking.end = end.toISOString();
  return store.saveBooking(booking);
}

function cancelBooking(store, id, { now } = {}) {
  const booking = store.getBooking(id);
  if (!booking || booking.status === 'cancelled') throw new ValidationError('booking not found', 404);
  if (new Date(booking.start).getTime() - now.getTime() < HOUR) {
    throw new ValidationError('bookings can only be cancelled up to one hour before they start', 409);
  }
  booking.status = 'cancelled';
  return store.saveBooking(booking);
}

module.exports = {
  ValidationError,
  overlaps,
  createBooking,
  rescheduleBooking,
  cancelBooking,
  MAX_DURATION_MINUTES,
};
