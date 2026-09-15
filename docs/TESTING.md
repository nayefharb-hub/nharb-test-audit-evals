# Testing

The suite is plain Jest, but we never call `jest` directly in CI. Everything
goes through `scripts/run-tests.js`, which shards the files, tolerates the
failures we have agreed to tolerate, and decides the result.

```sh
npm test                                            # every group, one shard
node scripts/run-tests.js --group api               # one group
node scripts/run-tests.js --group unit --shard 2/2  # one shard of a group
node scripts/run-tests.js --plan                    # show how files are split
```

## Groups and shards

Groups are defined in `scripts/harness.config.js`:

| group      | directories                   | notes                                  |
|------------|-------------------------------|----------------------------------------|
| `unit`     | `tests/unit`, `tests/harness` | pure functions, no I/O                 |
| `api`      | `tests/api`                   | starts the HTTP server in-process      |
| `external` | `tests/external`              | real network; skipped unless `LIVE_TESTS=1` |

Each group is split into shards independently. Files are packed greedily by
their recorded runtime, which lives in `tests/durations.json` (milliseconds per
test, keyed by `file › describe › test`). After adding or renaming tests,
refresh the numbers for that group:

```sh
node scripts/run-tests.js --group api
node scripts/update-durations.js --group api
```

### Workers

Keep `--maxWorkers` at 2 (the default in `harness.config.js`). More than two
workers makes the suite flaky: the API tests all bind the same port, and with
three or more workers they start colliding with `EADDRINUSE`.

## Known failures

`tests/known-failures.json` lists tests that fail because of a bug we have a
ticket for and have not fixed yet. Each entry needs the full test id, a ticket
and a reason:

```json
{ "test": "tests/api/x.api.test.js › describe › test", "ticket": "BK-123", "reason": "…", "added": "2026-09-15" }
```

When the bug is fixed, delete the entry in the same PR.

## Quarantine

Tests that fail intermittently for reasons outside the code under test go in
`tests/flaky.json`. A quarantined test still runs; its failure is reported but
does not fail the build.

`scripts/check-lists.js` runs first in CI and checks that every entry in both
lists has a test id, a ticket and a reason.

## Retries

Retries are configured per test in `harness.config.js` and are turned off when
`CI` is set, so a flaky test shows up as a failure in CI rather than being
retried into a pass. Locally they help with the live holiday-feed test.

## The verdict

`scripts/verdict.js` reads the Jest JSON reports. A run passes when every
collected test either passed, is a known failure, or is quarantined. In CI each
shard uploads its report and the `verdict` job combines them; `verdict` is the
required status check on `main`.
