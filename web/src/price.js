'use strict';

const { parseDate, nightsBetween } = require('./dateRange');

const WEEKEND_SURCHARGE = 0.15;

function isWeekendNight(date) {
  const day = date.getDay();
  return day === 5 || day === 6; // Friday, Saturday
}

function quote(nightlyRate, checkIn, checkOut) {
  const nights = nightsBetween(checkIn, checkOut);
  const first = parseDate(checkIn);
  let weekendNights = 0;
  for (let i = 0; i < nights; i += 1) {
    const night = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i);
    if (isWeekendNight(night)) weekendNights += 1;
  }
  const subtotal = nightlyRate * nights;
  const surcharge = Math.round(nightlyRate * WEEKEND_SURCHARGE) * weekendNights;
  return { nights, weekendNights, subtotal, surcharge, total: subtotal + surcharge };
}

function formatPrice(cents, currency, locale = 'en-GB') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}

module.exports = { WEEKEND_SURCHARGE, isWeekendNight, quote, formatPrice };
