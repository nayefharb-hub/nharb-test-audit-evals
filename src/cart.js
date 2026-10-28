'use strict';

const initialCartState = Object.freeze({ items: [], discount: null });

function normalizeSku(sku) {
  return sku.trim().toUpperCase();
}

function addItem(state, item) {
  const sku = normalizeSku(item.sku);
  const qty = item.qty ?? 1;
  const index = state.items.findIndex((line) => line.sku === sku);

  if (index > -1) {
    return {
      ...state,
      items: state.items.map((line, i) => (i === index ? { ...line, qty: line.qty + qty } : line)),
    };
  }

  return {
    ...state,
    items: [...state.items, { sku, name: item.name, price: item.price, qty }],
  };
}

function setQty(state, sku, qty) {
  const key = normalizeSku(sku);
  if (qty <= 0) {
    return { ...state, items: state.items.filter((line) => line.sku !== key) };
  }
  return {
    ...state,
    items: state.items.map((line) => (line.sku === key ? { ...line, qty } : line)),
  };
}

function cartReducer(state = initialCartState, action = {}) {
  switch (action.type) {
    case 'cart/add':
      return addItem(state, action.item);
    case 'cart/remove':
      return setQty(state, action.sku, 0);
    case 'cart/setQty':
      return setQty(state, action.sku, action.qty);
    case 'cart/applyDiscount':
      return { ...state, discount: action.discount };
    case 'cart/removeDiscount':
      return { ...state, discount: null };
    case 'cart/clear':
      return initialCartState;
    default:
      return state;
  }
}

// Apply a rate to an amount in minor units, rounding half up to a whole unit.
function applyRate(amount, rate) {
  return Math.round(amount * rate);
}

function lineTotal(line) {
  return line.price * line.qty;
}

function discountAmount(subtotal, discount) {
  if (!discount) return 0;
  switch (discount.kind) {
    case 'percent':
      return applyRate(subtotal, discount.value / 100);
    case 'fixed':
      return Math.min(discount.value, subtotal);
    default:
      return 0;
  }
}

/** Totals for a cart, in minor units. */
function cartTotals(state, { taxRate = 0 } = {}) {
  const subtotal = state.items.reduce((sum, line) => sum + lineTotal(line), 0);
  const discount = discountAmount(subtotal, state.discount);
  const tax = applyRate(subtotal, taxRate);
  return { subtotal, discount, tax, total: subtotal - discount + tax };
}

module.exports = { cartReducer, cartTotals, lineTotal, initialCartState };
