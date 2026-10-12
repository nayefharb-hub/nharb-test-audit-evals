'use strict';

// All storefront dates are rendered in UTC so the same order shows the same
// dates regardless of where the page is opened.
const TIME_ZONE = 'UTC';
const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Invalid date: ${value}`);
  }
  return date;
}

/** "October 31, 2026" */
function formatOrderDate(value, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: TIME_ZONE,
  }).format(toDate(value));
}

/** "Nov 3" */
function formatShortDate(value, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: TIME_ZONE,
  }).format(toDate(value));
}

/** Whole calendar days from `now` until `value` (negative if in the past). */
function daysUntil(value, now = new Date()) {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const target = toDate(value);
  const end = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  return Math.round((end - start) / DAY_MS);
}

function isWeekend(date) {
  const day = date.getUTCDay();
  return day === 0 || day === 7;
}

/** Add `count` business days (Mon–Fri) to a date. */
function addBusinessDays(value, count) {
  const date = toDate(value);
  let added = 0;
  while (added < count) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (!isWeekend(date)) {
      added += 1;
    }
  }
  return date;
}

/** "Nov 2 – Nov 4" for an order shipped within min..max business days. */
function formatDeliveryWindow(orderDate, minDays, maxDays, locale = 'en-US') {
  const earliest = addBusinessDays(orderDate, minDays);
  const latest = addBusinessDays(orderDate, maxDays);
  return `${formatShortDate(earliest, locale)} – ${formatShortDate(latest, locale)}`;
}

module.exports = {
  formatOrderDate,
  formatShortDate,
  daysUntil,
  addBusinessDays,
  formatDeliveryWindow,
};
