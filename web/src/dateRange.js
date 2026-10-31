'use strict';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_NIGHTS = 30;

function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toUtcDay(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

// Count in UTC so a 23- or 25-hour day around a clock change still counts as one night.
function nightsBetween(checkIn, checkOut) {
  return Math.round((toUtcDay(checkOut) - toUtcDay(checkIn)) / DAY_MS);
}

function validateRange({ checkIn, checkOut }, today) {
  const errors = [];
  if (!checkIn || !checkOut) {
    errors.push('Choose check-in and check-out dates.');
    return errors;
  }
  if (checkIn < today) {
    errors.push('Check-in cannot be in the past.');
  }
  const n = nightsBetween(checkIn, checkOut);
  if (n < 1) {
    errors.push('Your stay must be at least one night.');
  } else if (n > MAX_NIGHTS) {
    errors.push(`Stays are limited to ${MAX_NIGHTS} nights.`);
  }
  return errors;
}

module.exports = { MAX_NIGHTS, parseDate, nightsBetween, validateRange };
