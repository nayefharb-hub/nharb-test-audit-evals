'use strict';

const { EventEmitter } = require('events');
const { ValidationError } = require('./bookings');

const DEFAULT_TTL_MS = 10 * 60 * 1000;

// A hold reserves a slot for a short time while the organiser confirms.
// Expired holds are released by a timer so the slot frees up even if nobody
// reads it again.
function createHoldManager(store, { ttlMs = DEFAULT_TTL_MS } = {}) {
  const holds = new Map();
  const events = new EventEmitter();

  function release(id, reason) {
    const hold = holds.get(id);
    if (!hold) return false;
    clearTimeout(hold.timer);
    holds.delete(id);
    events.emit('released', { id, reason });
    return true;
  }

  return {
    events,
    place(roomId, start, end, owner) {
      if (!store.getRoom(roomId)) throw new ValidationError('unknown room', 404);
      const range = { start: start.getTime(), end: end.getTime() };
      this.assertNotHeld(roomId, range);
      const id = store.nextId('hd');
      const timer = setTimeout(() => release(id, 'expired'), ttlMs);
      timer.unref();
      const hold = { id, roomId, owner, range, expiresAt: new Date(Date.now() + ttlMs).toISOString(), timer };
      holds.set(id, hold);
      return publicHold(hold);
    },
    get(id) {
      const hold = holds.get(id);
      return hold ? publicHold(hold) : null;
    },
    release,
    assertNotHeld(roomId, range, exceptId) {
      for (const hold of holds.values()) {
        if (hold.id === exceptId || hold.roomId !== roomId) continue;
        if (range.start < hold.range.end && hold.range.start < range.end) {
          throw new ValidationError(`slot is held (${hold.id})`, 409);
        }
      }
    },
    size: () => holds.size,
    clear() {
      for (const id of [...holds.keys()]) release(id, 'shutdown');
    },
  };
}

function publicHold(hold) {
  return {
    id: hold.id,
    roomId: hold.roomId,
    owner: hold.owner,
    start: new Date(hold.range.start).toISOString(),
    end: new Date(hold.range.end).toISOString(),
    expiresAt: hold.expiresAt,
  };
}

module.exports = { createHoldManager, DEFAULT_TTL_MS };
