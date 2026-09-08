'use strict';

const { minutesBetween } = require('./time');

// Room time is billed per started half hour. Short bookings carry a flat
// setup fee because the room still has to be turned around afterwards.
const SETUP_FEE = 15;
const SHORT_BOOKING_MINUTES = 60;
const MEMBER_DISCOUNT = 0.1;

function quote(room, start, end, { member = false } = {}) {
  const minutes = minutesBetween(start, end);
  const halfHours = Math.ceil(minutes / 30);
  const base = halfHours * (room.hourlyRate / 2);
  const setupFee = minutes < 30 ? SETUP_FEE : 0;
  const discount = member ? round2(base * MEMBER_DISCOUNT) : 0;
  return {
    roomId: room.id,
    minutes,
    billedHalfHours: halfHours,
    base: round2(base),
    setupFee,
    discount,
    total: round2(base + setupFee - discount),
    currency: 'EUR',
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { quote, SETUP_FEE, SHORT_BOOKING_MINUTES };
