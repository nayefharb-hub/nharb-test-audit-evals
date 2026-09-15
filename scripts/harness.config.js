'use strict';

module.exports = {
  // Each group is sharded independently. CI runs one job per group/shard.
  groups: {
    unit: ['tests/unit', 'tests/harness'],
    api: ['tests/api'],
    external: ['tests/external'],
  },
  defaultGroups: ['unit', 'api', 'external'],

  knownFailuresFile: 'tests/known-failures.json',
  quarantineFile: 'tests/flaky.json',
  durationsFile: 'tests/durations.json',

  // See docs/TESTING.md: the API suite gets flaky above two workers.
  workers: 2,

  // Per-test retry counts. Keep this list short: a retry hides real failures.
  retries: {
    // Hits the public Nager.Date API. Transient 5xx and connection resets from
    // a third-party service are not something the test can control, so allow
    // two more attempts before reporting a failure.
    'tests/external/holidays.live.test.js › Nager.Date holiday feed › knows Christmas Day 2026 for GB': 2,
  },
};
