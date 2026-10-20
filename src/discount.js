'use strict';

const CODE_PATTERN = /^[A-Z0-9]{4,16}$/;

function normalizeCode(raw) {
  return String(raw ?? '').trim().toUpperCase();
}

/**
 * Check a customer-entered discount code against the catalog.
 *
 * Catalog entries look like:
 *   { code: 'SAVE10', kind: 'percent', value: 10, minSubtotal: 5000, expiresAt: '2026-12-31T23:59:59Z' }
 *
 * Returns { valid: true, code, kind, value } or { valid: false, reason }.
 */
function validateDiscountCode(raw, { catalog, subtotal = 0, now = new Date() }) {
  const code = normalizeCode(raw);
  if (!CODE_PATTERN.test(code)) {
    return { valid: false, reason: 'malformed' };
  }

  const entry = catalog.find((candidate) => candidate.code === code);
  if (!entry) {
    return { valid: false, reason: 'unknown' };
  }

  if (entry.expires && new Date(entry.expires) < now) {
    return { valid: false, reason: 'expired' };
  }

  if (entry.minSubtotal && subtotal < entry.minSubtotal) {
    return { valid: false, reason: 'min_subtotal', minSubtotal: entry.minSubtotal };
  }

  return { valid: true, code: entry.code, kind: entry.kind, value: entry.value };
}

module.exports = { validateDiscountCode, normalizeCode };
