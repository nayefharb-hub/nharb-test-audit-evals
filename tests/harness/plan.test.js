'use strict';

const { fileWeight, planShards } = require('../../scripts/lib/plan');

const durations = {
  'tests/a.test.js › one': 100,
  'tests/a.test.js › two': 50,
  'tests/b.test.js › one': 120,
  'tests/c.test.js › one': 40,
  'tests/d.test.js › one': 30,
};

describe('shard planning', () => {
  test('sums recorded durations per file', () => {
    expect(fileWeight('tests/a.test.js', durations)).toBe(150);
    expect(fileWeight('tests/b.test.js', durations)).toBe(120);
  });

  test('does not mix up files that share a prefix', () => {
    expect(fileWeight('tests/a.test', { 'tests/a.test.jsx › x': 5 })).toBe(0);
  });

  test('puts every file in exactly one shard', () => {
    const files = ['tests/a.test.js', 'tests/b.test.js', 'tests/c.test.js', 'tests/d.test.js'];
    const shards = planShards(files, durations, 3);
    expect(shards.flatMap((s) => s.files).sort()).toEqual(files);
  });

  test('balances by recorded duration', () => {
    const files = ['tests/a.test.js', 'tests/b.test.js', 'tests/c.test.js', 'tests/d.test.js'];
    const [s1, s2] = planShards(files, durations, 2);
    expect(s1).toEqual({ files: ['tests/a.test.js', 'tests/d.test.js'], weight: 180 });
    expect(s2).toEqual({ files: ['tests/b.test.js', 'tests/c.test.js'], weight: 160 });
  });
});
