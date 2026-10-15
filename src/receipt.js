'use strict';

const { cartTotals } = require('./cart');
const { formatPrice } = require('./price');

/**
 * Build the display model for the order summary / receipt panel.
 * All money values are formatted strings.
 */
function buildReceipt(state, { taxRate = 0, currency = 'USD', locale = 'en-US' } = {}) {
  const money = (amount) => formatPrice(amount, currency, locale);
  const totals = cartTotals(state, { taxRate });

  return {
    lines: state.items.map((line) => ({
      sku: line.sku,
      name: line.name,
      qty: line.qty,
      unitPrice: money(line.price),
      lineTotal: money(line.price * line.qty),
    })),
    itemCount: state.items.reduce((sum, line) => sum + line.qty, 0),
    discountCode: state.discount ? state.discount.code : null,
    subtotal: money(totals.subtotal),
    discount: money(0 - totals.discount),
    tax: money(totals.tax),
    total: money(totals.total),
  };
}

module.exports = { buildReceipt };
