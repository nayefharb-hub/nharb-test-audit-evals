#!/usr/bin/env node
'use strict';

// Sanity checks for tests/known-failures.json and tests/quarantine.json.
// Runs in CI before the test jobs.

const config = require('./harness.config');
const { readList } = require('./lib/lists');

const problems = [];

for (const file of [config.knownFailuresFile, config.quarantineFile]) {
  const seen = new Set();
  readList(file).forEach((entry, i) => {
    const where = `${file}[${i}]`;
    if (!entry.test) problems.push(`${where}: missing "test"`);
    if (entry.ticket === undefined) problems.push(`${where}: missing "ticket"`);
    if (!entry.reason) problems.push(`${where}: missing "reason"`);
    if (seen.has(entry.test)) problems.push(`${where}: duplicate entry for ${entry.test}`);
    seen.add(entry.test);
  });
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('known-failure and quarantine lists look fine');
