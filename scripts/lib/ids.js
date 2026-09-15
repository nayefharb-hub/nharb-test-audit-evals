'use strict';

const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SEP = ' › ';

function relFile(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function testId(file, assertion) {
  return [relFile(path.resolve(ROOT, file)), ...assertion.ancestorTitles, assertion.title].join(SEP);
}

function fileOf(id) {
  return id.split(SEP)[0];
}

module.exports = { ROOT, SEP, relFile, testId, fileOf };
