'use strict';

const { quote, SETUP_FEE } = require('../../src/pricing');

const birch = { id: 'birch', hourlyRate: 25 };
const at = (hhmm) => new Date(`2026-10-13T${hhmm}:00Z`);

describe('pricing', () => {
  test('bills whole hours at the hourly rate', () => {
    expect(quote(birch, at('10:00'), at('12:00'))).toMatchObject({ base: 50, total: 50, billedHalfHours: 4 });
  });

  test('rounds partial half hours up', () => {
    expect(quote(birch, at('10:00'), at('11:10'))).toMatchObject({ billedHalfHours: 3, base: 37.5 });
  });

  test('applies the setup fee to bookings shorter than an hour', () => {
    expect(quote(birch, at('10:00'), at('10:45')).setupFee).toBe(SETUP_FEE);
  });

  test('does not charge a setup fee for bookings of an hour or more', () => {
    expect(quote(birch, at('10:00'), at('11:00')).setupFee).toBe(0);
  });

  test('gives members ten percent off the room time', () => {
    expect(quote(birch, at('10:00'), at('12:00'), { member: true })).toMatchObject({ discount: 5, total: 45 });
  });
});
