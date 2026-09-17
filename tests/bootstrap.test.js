// L0 canary: proves the test runner works and the toolchain contract holds.
// This is infrastructure, not feature coverage (real tests land per phase DoD).
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('L0 toolchain', () => {
  it('runs on Node >= 20 (see package.json engines)', () => {
    const major = Number(process.versions.node.split('.')[0]);
    assert.ok(major >= 20, `expected Node >= 20, got ${process.versions.node}`);
  });

  it('repo contract files exist', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const root = path.join(__dirname, '..');
    for (const f of ['AGENTS.md', 'package.json', 'docs/README.md', 'docs/execution-plan.md']) {
      assert.ok(fs.existsSync(path.join(root, f)), `missing contract file: ${f}`);
    }
  });
});
