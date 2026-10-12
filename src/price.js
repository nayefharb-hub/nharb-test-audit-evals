'use strict';

// Number of minor units (cents, pence, ...) per currency we sell in.
const MINOR_UNITS = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
};

/**
 * Format an integer amount of minor units as a localized currency string.
 *
 *   formatPrice(1999)                  // "$19.99"
 *   formatPrice(1999, 'EUR', 'de-DE')  // "19,99 €"
 *   formatPrice(1500, 'JPY', 'ja-JP')  // "￥1,500"
 */
function formatPrice(amount, currency = 'USD', locale = 'en-US') {
  if (!Number.isInteger(amount)) {
    throw new TypeError(`amount must be an integer number of minor units, got ${amount}`);
  }
  const digits = MINOR_UNITS[currency];
  if (digits === undefined) {
    throw new RangeError(`Unsupported currency: ${currency}`);
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount / 10 ** digits);
}

module.exports = { formatPrice, MINOR_UNITS };
