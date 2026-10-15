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

function discountAmount(subtotal, discount) {
  if (!discount) return 0;
  if (discount.kind === 'percent') {
    return Math.round((subtotal * discount.value) / 100);
  }
  if (discount.kind === 'fixed') {
    return Math.min(discount.value, subtotal);
  }
  return 0;
}

/**
 * Totals for a cart, in minor units. Tax is charged on the discounted
 * subtotal.
 */
function cartTotals(state, { taxRate = 0 } = {}) {
  const subtotal = state.items.reduce((sum, line) => sum + line.price * line.qty, 0);
  const discount = discountAmount(subtotal, state.discount);
  const taxable = subtotal - discount;
  const tax = Math.round(taxable * taxRate);
  return { subtotal, discount, tax, total: taxable + tax };
}

module.exports = { cartReducer, cartTotals, initialCartState };
