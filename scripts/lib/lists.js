'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT } = require('./ids');

const DAY_MS = 24 * 60 * 60 * 1000;

function readList(file) {
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) return [];
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

// Expiry is checked against the commit being tested rather than the wall
// clock, so re-running an old commit gives the same answer it gave then.
function referenceDate() {
  try {
    const iso = execFileSync('git', ['log', '-1', '--format=%cI'], { cwd: ROOT, encoding: 'utf8' }).trim();
    if (iso) return new Date(iso);
  } catch (_) {
    // not a git checkout
  }
  return new Date();
}

function validateQuarantine(entries, { maxDays, now }) {
  const errors = [];
  for (const entry of entries) {
    if (!entry.expires) continue;
    const added = new Date(entry.added);
    const expires = new Date(entry.expires);
    if ((expires - added) / DAY_MS > maxDays) {
      errors.push(`${entry.test}: expiry is more than ${maxDays} days after it was added`);
    }
    if (expires < now) {
      errors.push(`${entry.test}: quarantine expired on ${entry.expires} (${entry.ticket})`);
    }
  }
  return errors;
}

function loadLists(config) {
  const knownFailures = readList(config.knownFailuresFile);
  const quarantine = readList(config.quarantineFile);
  const errors = validateQuarantine(quarantine, { maxDays: config.quarantineMaxDays, now: referenceDate() });
  return { knownFailures, quarantine, errors };
}

module.exports = { loadLists, readList, validateQuarantine, referenceDate };
