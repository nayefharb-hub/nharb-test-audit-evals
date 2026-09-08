'use strict';

function stamp(iso) {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeText(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function bookingToICal(booking, room) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//roombook//EN',
    'BEGIN:VEVENT',
    `UID:${booking.id}@roombook`,
    `DTSTART:${stamp(booking.start)}`,
    `DTEND:${stamp(booking.end)}`,
    `SUMMARY:${escapeText(booking.title || `Booking in ${room.name}`)}`,
    `LOCATION:${escapeText(room.name)}`,
    `ORGANIZER:${escapeText(booking.organizer)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

module.exports = { bookingToICal };
