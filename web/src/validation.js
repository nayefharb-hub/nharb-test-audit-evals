'use strict';

const { validateRange } = require('./dateRange');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateBookingForm(form, { capacity, today }) {
  const errors = {};

  if (!form.name || !form.name.trim()) {
    errors.name = 'Please enter the lead guest’s name.';
  }
  if (!EMAIL_RE.test(form.email || '')) {
    errors.email = 'Please enter a valid email address.';
  }

  const party = Number(form.partySize);
  if (!Number.isInteger(party) || party < 1) {
    errors.partySize = 'At least one guest is required.';
  } else if (party > capacity) {
    errors.partySize = `This room sleeps up to ${capacity}.`;
  }

  const dateErrors = validateRange(form, today);
  if (dateErrors.length) {
    errors.dates = dateErrors[0];
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

module.exports = { validateBookingForm };
