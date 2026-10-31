const { formatPrice, isWeekendNight, quote } = require('./price');

describe('quote', () => {
  test('midweek stay has no surcharge', () => {
    // Mon 4 May -> Thu 7 May 2026
    expect(quote(10000, '2026-05-04', '2026-05-07')).toEqual({
      nights: 3,
      weekendNights: 0,
      subtotal: 30000,
      surcharge: 0,
      total: 30000,
    });
  });

  test('adds the weekend surcharge for Friday and Saturday nights', () => {
    // Thu 7 May -> Sun 10 May 2026: Thu, Fri, Sat
    const q = quote(10000, '2026-05-07', '2026-05-10');
    expect(q.weekendNights).toBe(2);
    expect(q.surcharge).toBe(4000);
    expect(q.total).toBe(34000);
  });

  test('Sunday night is not a weekend night', () => {
    expect(isWeekendNight(new Date(2026, 4, 10))).toBe(false);
  });
});

describe('formatPrice', () => {
  test('formats pounds for en-GB', () => {
    expect(formatPrice(12000, 'GBP')).toBe('£120.00');
  });

  test('keeps pennies', () => {
    expect(formatPrice(9999, 'GBP')).toBe('£99.99');
  });

  test('formats euros in a German locale', () => {
    expect(formatPrice(123456, 'EUR', 'de-DE')).toBe('1.234,56 €');
  });
});
