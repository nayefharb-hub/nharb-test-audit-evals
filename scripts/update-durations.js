#!/usr/bin/env node
'use strict';

// Rewrites the recorded durations for one group from the reports of a run:
//
//   node scripts/run-tests.js --group unit
//   node scripts/update-durations.js --group unit
//
// Entries for files outside the group are left alone.

const fs = require('fs');
const path = require('path');
const config = require('./harness.config');
const { ROOT, testId, fileOf } = require('./lib/ids');

const argv = process.argv.slice(2);
const group = argv[argv.indexOf('--group') + 1];
const reportDir = argv.includes('--report-dir') ? argv[argv.indexOf('--report-dir') + 1] : 'reports';
if (!argv.includes('--group') || !config.groups[group]) {
  console.error('usage: update-durations.js --group <name> [--report-dir reports]');
  process.exit(1);
}

const durationsPath = path.join(ROOT, config.durationsFile);
const durations = JSON.parse(fs.readFileSync(durationsPath, 'utf8'));
const inGroup = (id) => config.groups[group].some((dir) => fileOf(id).startsWith(`${dir}/`));

for (const id of Object.keys(durations)) {
  if (inGroup(id)) delete durations[id];
}

const reports = fs.readdirSync(path.join(ROOT, reportDir)).filter((n) => n.startsWith(`${group}-`) && n.endsWith('.json'));
for (const name of reports) {
  const report = JSON.parse(fs.readFileSync(path.join(ROOT, reportDir, name), 'utf8'));
  for (const file of report.testResults) {
    for (const a of file.assertionResults) {
      if (a.status === 'passed' || a.status === 'failed') durations[testId(file.name, a)] = Math.max(1, Math.round(a.duration || 0));
    }
  }
}

const sorted = Object.fromEntries(Object.entries(durations).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(durationsPath, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`updated ${Object.keys(sorted).filter(inGroup).length} ${group} durations`);
