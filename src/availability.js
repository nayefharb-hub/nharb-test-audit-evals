'use strict';

const { MINUTE } = require('./time');

const OPEN_HOUR = 8;
const CLOSE_HOUR = 18;
const SLOT_MINUTES = 30;

// Returns free half-hour slots for a room on a given UTC date.
async function freeSlots(store, roomId, date, { holidays } = {}) {
  if (holidays && (await holidays.isHoliday(date))) return [];

  const dayStart = new Date(`${date}T00:00:00Z`).getTime();
  const open = dayStart + OPEN_HOUR * 60 * MINUTE;
  const close = dayStart + CLOSE_HOUR * 60 * MINUTE;
  const taken = store.bookingsForRoom(roomId).map((b) => ({
    start: new Date(b.start).getTime(),
    end: new Date(b.end).getTime(),
  }));

  const slots = [];
  for (let t = open; t < close; t += SLOT_MINUTES * MINUTE) {
    const slot = { start: t, end: t + SLOT_MINUTES * MINUTE };
    if (!taken.some((b) => slot.start < b.end && b.start < slot.end)) {
      slots.push({ start: new Date(slot.start).toISOString(), end: new Date(slot.end).toISOString() });
    }
  }
  return slots;
}

module.exports = { freeSlots, OPEN_HOUR, CLOSE_HOUR, SLOT_MINUTES };
