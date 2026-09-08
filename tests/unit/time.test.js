'use strict';

const { parseInstant, isDateString, startOfDayUTC, minutesBetween } = require('../../src/time');

describe('time helpers', () => {
  test('parses timestamps with a Z suffix or an explicit offset', () => {
    expect(parseInstant('2026-10-13T10:00:00Z').toISOString()).toBe('2026-10-13T10:00:00.000Z');
    expect(parseInstant('2026-10-13T12:00:00+02:00').toISOString()).toBe('2026-10-13T10:00:00.000Z');
  });

  test('rejects bare local times and garbage', () => {
    expect(parseInstant('2026-10-13T10:00:00')).toBeNull();
    expect(parseInstant('tomorrow')).toBeNull();
    expect(parseInstant(42)).toBeNull();
  });

  test('validates calendar dates', () => {
    expect(isDateString('2026-02-28')).toBe(true);
    expect(isDateString('2026-13-01')).toBe(false);
    expect(isDateString('2026-2-1')).toBe(false);
  });

  test('computes start of day and minute differences in UTC', () => {
    const d = new Date('2026-10-13T23:59:00Z');
    expect(startOfDayUTC(d).toISOString()).toBe('2026-10-13T00:00:00.000Z');
    expect(minutesBetween(new Date('2026-10-13T10:00:00Z'), new Date('2026-10-13T11:45:00Z'))).toBe(105);
  });
});
