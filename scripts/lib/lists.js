'use strict';

const fs = require('fs');
const path = require('path');
const { ROOT } = require('./ids');

function readList(file) {
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) return [];
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

function loadLists(config) {
  return {
    knownFailures: readList(config.knownFailuresFile),
    quarantine: readList(config.quarantineFile),
    errors: [],
  };
}

module.exports = { loadLists, readList };
