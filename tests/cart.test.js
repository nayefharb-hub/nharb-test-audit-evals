const { cartReducer, cartTotals, initialCartState } = require('../src/cart');

const TEE = { sku: 'tee-blk-m', name: 'Logo Tee (Black, M)', price: 2400 };
const MUG = { sku: 'MUG-01', name: 'Enamel Mug', price: 1450 };
const CAP = { sku: 'CAP-NVY', name: 'Six-Panel Cap', price: 2800 };

const add = (item, qty) => ({ type: 'cart/add', item: { ...item, qty } });

function cartWith(...actions) {
  return actions.reduce(cartReducer, initialCartState);
}

describe('cartReducer', () => {
  test('starts empty', () => {
    expect(cartReducer(undefined, { type: '@@init' })).toEqual({ items: [], discount: null });
  });

  test('adds a new line with the normalized SKU', () => {
    const state = cartWith(add(TEE, 2));
    expect(state.items).toEqual([{ sku: 'TEE-BLK-M', name: TEE.name, price: 2400, qty: 2 }]);
  });

  test('adding an existing SKU increases its quantity instead of adding a line', () => {
    const state = cartWith(add(TEE, 1), add(MUG, 1), add(TEE, 2));
    expect(state.items).toHaveLength(2);
    expect(state.items[0]).toMatchObject({ sku: 'TEE-BLK-M', qty: 3 });
    expect(state.items[1]).toMatchObject({ sku: 'MUG-01', qty: 1 });
  });

  test('matches SKUs case-insensitively', () => {
    const state = cartWith(add(MUG, 1), add({ ...MUG, sku: ' mug-01 ' }, 1));
    expect(state.items).toEqual([expect.objectContaining({ sku: 'MUG-01', qty: 2 })]);
  });

  test('rejects a non-positive quantity', () => {
    expect(() => cartReducer(initialCartState, add({ id: 'cap-nvy', price: 2800 }, -2))).toThrow();
  });

  test('does not mutate the previous state', () => {
    const before = cartWith(add(TEE, 1));
    const snapshot = JSON.parse(JSON.stringify(before));
    cartReducer(before, add(TEE, 1));
    expect(before).toEqual(snapshot);
  });

  test('clear resets to the initial state', () => {
    const state = cartWith(add(TEE, 1), { type: 'cart/applyDiscount', discount: { code: 'SAVE10' } });
    expect(cartReducer(state, { type: 'cart/clear' })).toBe(initialCartState);
  });
});

describe('editing quantities', () => {
  let state = cartReducer(undefined, { type: '@@init' });

  test('fills the cart', () => {
    state = cartReducer(state, add(TEE, 1));
    state = cartReducer(state, add(CAP, 1));
    expect(state.items).toHaveLength(2);
  });

  test('setQty replaces the quantity', () => {
    state = cartReducer(state, { type: 'cart/setQty', sku: 'cap-nvy', qty: 4 });
    expect(state.items.find((line) => line.sku === 'CAP-NVY').qty).toBe(4);
  });

  test('setQty to zero removes the line', () => {
    state = cartReducer(state, { type: 'cart/setQty', sku: 'TEE-BLK-M', qty: 0 });
    expect(state.items).toHaveLength(1);
    expect(state.items[0].sku).toBe('CAP-NVY');
  });
});

describe('cartTotals', () => {
  test('sums line totals into the subtotal', () => {
    const state = cartWith(add(TEE, 2), add(MUG, 3));
    expect(cartTotals(state)).toEqual({ subtotal: 9150, discount: 0, tax: 0, total: 9150 });
  });

  test('applies a percentage discount, rounding to the nearest cent', () => {
    const state = cartWith(add(MUG, 1), {
      type: 'cart/applyDiscount',
      discount: { code: 'SAVE15', kind: 'percent', value: 15 },
    });
    // 15% of 14.50 is 2.175
    expect(cartTotals(state)).toMatchObject({ discount: 218, total: 1232 });
  });

  test('caps a fixed discount at the subtotal', () => {
    const state = cartWith(add(MUG, 1), {
      type: 'cart/applyDiscount',
      discount: { code: 'GIFT20', kind: 'fixed', value: 2000 },
    });
    expect(cartTotals(state)).toMatchObject({ discount: 1450, total: 0 });
  });

  test('adds tax on top of the subtotal', () => {
    const state = cartWith(add(CAP, 1));
    expect(cartTotals(state, { taxRate: 0.0825 })).toEqual({
      subtotal: 2800,
      discount: 0,
      tax: 231,
      total: 3031,
    });
  });
});
