'use strict';

const { createHolidayCalendar } = require('../../src/holidays');

// These talk to the real Nager.Date API and only run with LIVE_TESTS=1.
const live = process.env.LIVE_TESTS === '1' ? describe : describe.skip;

live('Nager.Date holiday feed', () => {
  test('knows Christmas Day 2026 for GB', async () => {
    const calendar = createHolidayCalendar({ country: 'GB' });
    expect(await calendar.isHoliday('2026-12-25')).toBe(true);
    expect(await calendar.isHoliday('2026-12-23')).toBe(false);
  });

  test('answers within the latency budget', async () => {
    const calendar = createHolidayCalendar({ country: 'GB', timeoutMs: 800 });
    const started = Date.now();
    await calendar.list(2027);
    expect(Date.now() - started).toBeLessThan(800);
  });
});
