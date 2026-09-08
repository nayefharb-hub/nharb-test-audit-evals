'use strict';

const { bookingToICal } = require('../../src/ical');

const room = { id: 'atlas', name: 'Atlas' };
const booking = {
  id: 'bk_00001',
  roomId: 'atlas',
  start: '2026-10-13T10:00:00.000Z',
  end: '2026-10-13T11:00:00.000Z',
  organizer: 'ana@example.com',
  title: 'Planning; Q4, draft',
};

describe('iCal export', () => {
  test('emits a single VEVENT with UTC times', () => {
    const ics = bookingToICal(booking, room);
    expect(ics).toContain('DTSTART:20261013T100000Z');
    expect(ics).toContain('DTEND:20261013T110000Z');
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  });

  test('escapes separators in text fields', () => {
    expect(bookingToICal(booking, room)).toContain('SUMMARY:Planning\; Q4\\, draft');
  });

  test('uses CRLF line endings', () => {
    expect(bookingToICal(booking, room).split('\r\n')[0]).toBe('BEGIN:VCALENDAR');
  });
});
