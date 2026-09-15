'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT, SEP } = require('./ids');

function collectFiles(dirs) {
  const out = [];
  const walk = (dir) => {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) return;
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (entry.name.endsWith('.test.js')) out.push(rel);
    }
  };
  dirs.forEach(walk);
  return out.sort();
}

// Expected runtime of a file: the sum of its recorded per-test durations.
function fileWeight(file, durations) {
  const prefix = file + SEP;
  let total = 0;
  for (const [id, ms] of Object.entries(durations)) {
    if (id.startsWith(prefix)) total += ms;
  }
  return total;
}

// Greedy longest-first packing: heaviest file goes to the lightest shard.
function planShards(files, durations, count) {
  const shards = Array.from({ length: count }, () => ({ files: [], weight: 0 }));
  const weighted = files
    .map((file) => ({ file, weight: fileWeight(file, durations) }))
    .sort((a, b) => b.weight - a.weight || a.file.localeCompare(b.file));
  for (const { file, weight } of weighted) {
    const target = shards.reduce((min, s) => (s.weight < min.weight ? s : min), shards[0]);
    target.files.push(file);
    target.weight += weight;
  }
  return shards;
}

module.exports = { collectFiles, fileWeight, planShards };
