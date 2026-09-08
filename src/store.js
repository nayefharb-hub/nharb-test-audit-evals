'use strict';

const DEFAULT_ROOMS = [
  { id: 'atlas', name: 'Atlas', capacity: 12, hourlyRate: 40 },
  { id: 'birch', name: 'Birch', capacity: 6, hourlyRate: 25 },
  { id: 'cedar', name: 'Cedar', capacity: 4, hourlyRate: 18 },
  { id: 'dune', name: 'Dune', capacity: 20, hourlyRate: 60 },
];

function createStore({ rooms = DEFAULT_ROOMS } = {}) {
  const roomMap = new Map(rooms.map((r) => [r.id, { ...r }]));
  const bookings = new Map();
  let seq = 0;

  return {
    listRooms() {
      return [...roomMap.values()];
    },
    getRoom(id) {
      return roomMap.get(id) || null;
    },
    nextId(prefix) {
      seq += 1;
      return `${prefix}_${String(seq).padStart(5, '0')}`;
    },
    saveBooking(booking) {
      bookings.set(booking.id, booking);
      return booking;
    },
    getBooking(id) {
      return bookings.get(id) || null;
    },
    deleteBooking(id) {
      return bookings.delete(id);
    },
    bookingsForRoom(roomId) {
      return [...bookings.values()]
        .filter((b) => b.roomId === roomId && b.status !== 'cancelled')
        .sort((a, b) => a.start.localeCompare(b.start));
    },
  };
}

module.exports = { createStore, DEFAULT_ROOMS };
