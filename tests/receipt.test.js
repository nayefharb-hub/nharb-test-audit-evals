const { cartReducer, initialCartState } = require('../src/cart');
const { buildReceipt } = require('../src/receipt');

const catalog = {
  tee: { sku: 'TEE-BLK-M', name: 'Logo Tee (Black, M)', price: 2400 },
  hoodie: { sku: 'HD-GRY-L', name: 'Heavyweight Hoodie (Grey, L)', price: 6800 },
  mug: { sku: 'MUG-01', name: 'Enamel Mug', price: 1450 },
  cap: { sku: 'CAP-NVY', name: 'Six-Panel Cap', price: 2800 },
  socks: { sku: 'SCK-3PK', name: 'Crew Socks (3-pack)', price: 1600 },
  tote: { sku: 'TOTE-NAT', name: 'Canvas Tote', price: 1999 },
};

function cart(lines, discount = null) {
  let state = lines.reduce(
    (acc, [key, qty]) => cartReducer(acc, { type: 'cart/add', item: { ...catalog[key], qty } }),
    initialCartState,
  );
  if (discount) {
    state = cartReducer(state, { type: 'cart/applyDiscount', discount });
  }
  return state;
}

describe('buildReceipt', () => {
  test('single item, no discount', () => {
    expect(buildReceipt(cart([['mug', 2]]))).toMatchInlineSnapshot(`
      {
        "discount": "$0.00",
        "discountCode": null,
        "itemCount": 2,
        "lines": [
          {
            "lineTotal": "$29.00",
            "name": "Enamel Mug",
            "qty": 2,
            "sku": "MUG-01",
            "unitPrice": "$14.50",
          },
        ],
        "subtotal": "$29.00",
        "tax": "$0.00",
        "total": "$29.00",
      }
    `);
  });

  test('mixed cart with a discount code and sales tax', () => {
    const state = cart(
      [
        ['tee', 2],
        ['hoodie', 1],
        ['mug', 3],
        ['cap', 1],
        ['socks', 2],
        ['tote', 1],
      ],
      { code: 'FALL10', kind: 'percent', value: 10 },
    );

    expect(buildReceipt(state, { taxRate: 0.08 })).toMatchSnapshot();
  });

  test('counts units, not lines', () => {
    const receipt = buildReceipt(cart([['tee', 2], ['socks', 3]]));
    expect(receipt.itemCount).toBe(5);
    expect(receipt.lines).toHaveLength(2);
  });
});
