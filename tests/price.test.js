const { formatPrice } = require('../src/price');

describe('formatPrice', () => {
  test.each([
    [1999, 'USD', 'en-US', '$19.99'],
    [5, 'USD', 'en-US', '$0.05'],
    [123456, 'USD', 'en-US', '$1,234.56'],
    [-500, 'USD', 'en-US', '-$5.00'],
    [1999, 'GBP', 'en-GB', '£19.99'],
    [1999, 'EUR', 'de-DE', '19,99 €'],
  ])('formats %i %s in %s as %s', (amount, currency, locale, expected) => {
    expect(formatPrice(amount, currency, locale)).toBe(expected);
  });

  test('defaults to USD in en-US', () => {
    expect(formatPrice(2500)).toBe('$25.00');
  });

  test('treats JPY amounts as whole yen', () => {
    expect(formatPrice(1500, 'JPY', 'en-US')).toBe('¥1,500');
  });

  test('rejects fractional minor units', () => {
    expect(() => formatPrice(19.99)).toThrow(TypeError);
  });

  test('rejects currencies we do not sell in', () => {
    expect(() => formatPrice(100, 'CHF')).toThrow('Unsupported currency: CHF');
  });
});
