'use strict';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Accepts ISO-8601 strings with an explicit offset or a trailing "Z".
// Bare local times are rejected so we never guess a timezone.
const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

function parseInstant(value) {
  if (typeof value !== 'string' || !ISO_WITH_OFFSET.test(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isDateString(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

function startOfDayUTC(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function minutesBetween(start, end) {
  return Math.round((end.getTime() - start.getTime()) / MINUTE);
}

module.exports = {
  MINUTE,
  HOUR,
  DAY,
  parseInstant,
  isDateString,
  startOfDayUTC,
  dateKey,
  minutesBetween,
};
