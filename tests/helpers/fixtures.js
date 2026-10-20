const fs = require('fs');
const path = require('path');

const FIXTURE_DIR = path.join(__dirname, '..', 'fixtures');

/**
 * Read a JSON fixture by name (without extension). Falls back to `defaults`
 * so suites still run in checkouts where fixtures are generated separately.
 */
function loadFixture(name, defaults) {
  try {
    return JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, `${name}.json`), 'utf8'));
  } catch {
    return defaults;
  }
}

module.exports = { loadFixture };
