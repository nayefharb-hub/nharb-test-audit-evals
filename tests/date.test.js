const {
  formatOrderDate,
  formatShortDate,
  daysUntil,
  addBusinessDays,
  formatDeliveryWindow,
} = require('../src/date');

describe('formatOrderDate', () => {
  test('uses the long month name', () => {
    expect(formatOrderDate('2026-10-31T15:00:00Z')).toBe('October 31, 2026');
  });

  test('renders in UTC regardless of the offset in the input', () => {
    expect(formatOrderDate('2026-11-01T01:30:00+05:00')).toBe('October 31, 2026');
  });
});

describe('daysUntil', () => {
  const now = new Date('2026-10-31T22:00:00Z');

  test('counts calendar days, not 24h periods', () => {
    expect(daysUntil('2026-11-01T01:00:00Z', now)).toBe(1);
  });

  test('is negative for past dates', () => {
    expect(daysUntil('2026-10-28T12:00:00Z', now)).toBe(-3);
  });
});

describe('delivery estimates', () => {
  test('adds business days within a week', () => {
    // Monday + 3 business days is Thursday.
    const result = addBusinessDays('2026-10-26T10:00:00Z', 3);
    expect(formatShortDate(result)).toBe('Oct 29');
  });

  test('formats the delivery window for an order placed on a Thursday', () => {
    const ordered = new Date('2026-10-29T09:00:00Z');
    const earliest = formatShortDate(addBusinessDays(ordered, 2));
    const latest = formatShortDate(addBusinessDays(ordered, 4));

    expect(formatDeliveryWindow(ordered, 2, 4)).toBe(`${earliest} – ${latest}`);
  });
});
