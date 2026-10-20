const { validateDiscountCode } = require('../src/discount');
const { loadFixture } = require('./helpers/fixtures');

const NOW = new Date('2026-10-31T12:00:00Z');

const catalog = loadFixture('discount-codes.json', [
  { code: 'WELCOME5', kind: 'fixed', value: 500 },
  { code: 'SAVE10', kind: 'percent', value: 10, minSubtotal: 5000 },
]);

const check = (code, subtotal = 10000) => validateDiscountCode(code, { catalog, subtotal, now: NOW });

describe('validateDiscountCode', () => {
  test('accepts a known code regardless of case and surrounding whitespace', () => {
    expect(check('  welcome5 ')).toEqual({ valid: true, code: 'WELCOME5', kind: 'fixed', value: 500 });
  });

  test.each(['', 'AB', 'SAVE 10', 'SAVE-10', 'X'.repeat(17)])('rejects malformed input %p', (input) => {
    expect(check(input)).toEqual({ valid: false, reason: 'malformed' });
  });

  test('rejects codes that are not in the catalog', () => {
    expect(check('NOTACODE')).toEqual({ valid: false, reason: 'unknown' });
  });

  test('rejects a code below its minimum subtotal and reports the minimum', () => {
    expect(check('SAVE10', 4999)).toEqual({ valid: false, reason: 'min_subtotal', minSubtotal: 5000 });
  });

  test('accepts a code at exactly its minimum subtotal', () => {
    expect(check('SAVE10', 5000)).toMatchObject({ valid: true, value: 10 });
  });

  test('rejects expired codes', () => {
    const expired = catalog.filter((entry) => entry.expiresAt && new Date(entry.expiresAt) < NOW);
    for (const entry of expired) {
      expect(check(entry.code)).toEqual({ valid: false, reason: 'expired' });
    }
  });
});
