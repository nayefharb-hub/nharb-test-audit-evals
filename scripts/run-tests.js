#!/usr/bin/env node
'use strict';

// Runs the Jest suite one shard at a time.
//
//   node scripts/run-tests.js                          all default groups, one shard
//   node scripts/run-tests.js --group api --shard 2/3  second of three api shards
//   node scripts/run-tests.js --plan                   print the shard plan only
//
// The exit code comes from scripts/verdict.js, not from Jest, so that known
// failures and quarantined tests can be tolerated.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const config = require('./harness.config');
const { ROOT, SEP, relFile, fileOf } = require('./lib/ids');
const { collectFiles, planShards } = require('./lib/plan');
const { loadLists } = require('./lib/lists');
const { summarize, format } = require('./verdict');

function parseArgs(argv) {
  const args = { groups: [], shard: '1/1', plan: false, reportDir: 'reports', workers: config.workers };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = () => argv[++i];
    if (arg === '--group') args.groups.push(value());
    else if (arg === '--shard') args.shard = value();
    else if (arg === '--plan') args.plan = true;
    else if (arg === '--report-dir') args.reportDir = value();
    else if (arg === '--workers') args.workers = Number(value());
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!args.groups.length) args.groups = config.defaultGroups;
  const m = /^(\d+)\/(\d+)$/.exec(args.shard);
  if (!m || Number(m[1]) < 1 || Number(m[1]) > Number(m[2])) throw new Error(`bad --shard ${args.shard}, expected i/n`);
  args.index = Number(m[1]);
  args.total = Number(m[2]);
  return args;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function runJest(files, { workers, testNamePattern } = {}) {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'jest-')), 'report.json');
  const jestArgs = [
    require.resolve('jest/bin/jest'),
    '--ci',
    '--json',
    `--outputFile=${out}`,
    `--maxWorkers=${workers}`,
    '--runTestsByPath',
    ...files,
  ];
  if (testNamePattern) jestArgs.push('--testNamePattern', testNamePattern);
  const res = spawnSync(process.execPath, jestArgs, { cwd: ROOT, stdio: ['ignore', 'inherit', 'inherit'] });
  if (!fs.existsSync(out)) throw new Error(`jest did not write a report (exit ${res.status})`);
  return JSON.parse(fs.readFileSync(out, 'utf8'));
}

function failed(fileResult) {
  return fileResult.assertionResults.some((a) => a.status === 'failed');
}

// Re-run the tests that are allowed retries (see harness.config.js).
function applyRetries(report, workers) {
  // Retries stay off in CI so that flaky tests show up there.
  if (process.env.CI) return report;
  for (const [id, attempts] of Object.entries(config.retries)) {
    const file = fileOf(id);
    const idx = report.testResults.findIndex((r) => relFile(r.name) === file);
    if (idx === -1 || !failed(report.testResults[idx])) continue;
    const pattern = `^${escapeRegex(id.split(SEP).slice(1).join(' '))}$`;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      console.log(`retrying ${id} (attempt ${attempt}/${attempts})`);
      const rerun = runJest([file], { workers, testNamePattern: pattern });
      report.testResults[idx] = rerun.testResults[0];
      if (!failed(rerun.testResults[0])) break;
    }
  }
  return report;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const lists = loadLists(config);
  if (lists.errors.length) {
    console.error(lists.errors.join('\n'));
    process.exit(2);
  }
  const durations = JSON.parse(fs.readFileSync(path.join(ROOT, config.durationsFile), 'utf8'));
  fs.mkdirSync(path.join(ROOT, args.reportDir), { recursive: true });

  const combined = { testResults: [] };
  for (const group of args.groups) {
    const dirs = config.groups[group];
    if (!dirs) throw new Error(`unknown group: ${group}`);
    const shards = planShards(collectFiles(dirs), durations, args.total);
    const mine = shards[args.index - 1];
    console.log(`\n[${group} ${args.shard}] ${mine.files.length} files, ~${mine.weight}ms recorded`);
    if (args.plan) {
      shards.forEach((s, i) => console.log(`  shard ${i + 1}: ~${s.weight}ms  ${s.files.join(' ') || '(none)'}`));
      continue;
    }

    const report = mine.files.length ? applyRetries(runJest(mine.files, args), args.workers) : { testResults: [] };
    const name = `${group}-${args.index}of${args.total}.json`;
    fs.writeFileSync(path.join(ROOT, args.reportDir, name), JSON.stringify(report));
    console.log(format(summarize(report, lists), `${group} ${args.shard}`));
    combined.testResults.push(...report.testResults);
  }
  if (args.plan) return;

  const summary = summarize(combined, lists);
  console.log(`\n${format(summary, 'total')}`);
  process.exit(summary.ok ? 0 : 1);
}

main();
