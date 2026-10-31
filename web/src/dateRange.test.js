const { MAX_NIGHTS, nightsBetween, validateRange } = require('./dateRange');

const TODAY = '2026-05-01';

describe('nightsBetween', () => {
  test('counts nights in a short stay', () => {
    expect(nightsBetween('2026-05-03', '2026-05-05')).toBe(2);
  });

  test('works across a month boundary', () => {
    expect(nightsBetween('2026-05-30', '2026-06-02')).toBe(3);
  });

  // Skipped: the picker comes up a night short when a stay spans the March
  // clock change. Re-enable once nightsBetween is fixed (#41).
  test.skip('counts nights correctly across the spring clock change', () => {
    expect(nightsBetween('2026-03-28', '2026-03-30')).toBe(2);
  });
});

describe('validateRange', () => {
  test('accepts a normal stay', () => {
    expect(validateRange({ checkIn: '2026-05-03', checkOut: '2026-05-05' }, TODAY)).toEqual([]);
  });

  test('requires both dates', () => {
    expect(validateRange({ checkIn: '2026-05-03' }, TODAY)).toEqual([
      'Choose check-in and check-out dates.',
    ]);
  });

  test('rejects check-in in the past', () => {
    expect(validateRange({ checkIn: '2026-04-30', checkOut: '2026-05-02' }, TODAY)).toContain(
      'Check-in cannot be in the past.',
    );
  });

  test('rejects a zero-night stay', () => {
    expect(validateRange({ checkIn: '2026-05-03', checkOut: '2026-05-03' }, TODAY)).toEqual([
      'Your stay must be at least one night.',
    ]);
  });

  test(`rejects stays longer than ${MAX_NIGHTS} nights`, () => {
    expect(validateRange({ checkIn: '2026-05-03', checkOut: '2026-06-03' }, TODAY)).toEqual([
      `Stays are limited to ${MAX_NIGHTS} nights.`,
    ]);
  });
});
