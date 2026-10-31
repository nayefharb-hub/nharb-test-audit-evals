const { validateBookingForm } = require('./validation');

const ctx = { capacity: 2, today: '2026-05-01' };
const good = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  partySize: 2,
  checkIn: '2026-05-03',
  checkOut: '2026-05-05',
};

test('a complete form is valid', () => {
  expect(validateBookingForm(good, ctx)).toEqual({ valid: true, errors: {} });
});

test('name is required', () => {
  const { valid, errors } = validateBookingForm({ ...good, name: '   ' }, ctx);
  expect(valid).toBe(false);
  expect(errors.name).toBeDefined();
});

test.each(['ada', 'ada@', 'ada@example', 'a da@example.com'])('rejects email %p', (email) => {
  expect(validateBookingForm({ ...good, email }, ctx).errors.email).toBeDefined();
});

test('party size must be at least one', () => {
  expect(validateBookingForm({ ...good, partySize: 0 }, ctx).errors.partySize).toBe(
    'At least one guest is required.',
  );
});

test('party size cannot exceed room capacity', () => {
  expect(validateBookingForm({ ...good, partySize: 3 }, ctx).errors.partySize).toBe(
    'This room sleeps up to 2.',
  );
});

test('date problems are reported under dates', () => {
  const { errors } = validateBookingForm({ ...good, checkOut: good.checkIn }, ctx);
  expect(errors.dates).toBe('Your stay must be at least one night.');
});
