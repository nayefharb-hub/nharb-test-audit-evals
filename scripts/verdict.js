#!/usr/bin/env node
'use strict';

// Decides whether a test run is green. Used by run-tests.js for a single
// shard and by CI to combine the reports of every shard.

const fs = require('fs');
const path = require('path');
const config = require('./harness.config');
const { loadLists } = require('./lib/lists');
const { testId } = require('./lib/ids');

// Hook failures (beforeAll/afterAll) show up in some reporters as results
// titled "setup"/"teardown". They are not tests and are counted elsewhere.
const NON_TEST_TITLES = /\b(setup|teardown)\b/i;

function summarize(report, lists) {
  const known = new Set(lists.knownFailures.map((e) => e.test));
  const quarantined = new Set(lists.quarantine.map((e) => e.test));
  const summary = { collected: 0, passed: 0, skipped: 0, expected: [], quarantined: [], failed: [] };

  for (const file of report.testResults) {
    for (const a of file.assertionResults) {
      if (NON_TEST_TITLES.test(a.title)) continue;
      if (['pending', 'skipped', 'todo', 'disabled'].includes(a.status)) {
        summary.skipped += 1;
        continue;
      }
      summary.collected += 1;
      const id = testId(file.name, a);
      if (a.status === 'passed') summary.passed += 1;
      else if (known.has(id)) summary.expected.push(id);
      else if (quarantined.has(id)) summary.quarantined.push(id);
      else summary.failed.push({ id, message: (a.failureMessages || []).join('\n') });
    }
  }

  const accounted = summary.passed + summary.expected.length + summary.quarantined.length;
  summary.ok = summary.failed.length === 0 && accounted === summary.collected;
  return summary;
}

function format(summary, label = 'tests') {
  const lines = [
    `${label}: ${summary.passed} passed, ${summary.expected.length} expected failures, ` +
      `${summary.quarantined.length} quarantined, ${summary.failed.length} failed, ` +
      `${summary.skipped} skipped (${summary.collected} collected)`,
  ];
  for (const id of summary.expected) lines.push(`  expected failure: ${id}`);
  for (const id of summary.quarantined) lines.push(`  quarantined:      ${id}`);
  for (const f of summary.failed) lines.push(`  FAILED:           ${f.id}\n${indent(f.message)}`);
  lines.push(summary.ok ? 'verdict: PASS' : 'verdict: FAIL');
  return lines.join('\n');
}

function indent(text) {
  return text.split('\n').slice(0, 12).map((l) => `      ${l}`).join('\n');
}

function mergeReports(dir) {
  const merged = { testResults: [] };
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    const report = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
    merged.testResults.push(...report.testResults);
  }
  return merged;
}

if (require.main === module) {
  const dir = process.argv[2] || 'reports';
  const lists = loadLists(config);
  if (lists.errors.length) {
    console.error(lists.errors.join('\n'));
    process.exit(2);
  }
  const summary = summarize(mergeReports(dir), lists);
  console.log(format(summary, `all shards (${dir})`));
  process.exit(summary.ok ? 0 : 1);
}

module.exports = { summarize, format, mergeReports };
