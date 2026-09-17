// Boundary check (zero-dep): pure packages must not import Electron/React/app layers.
// WHY: P2 engine and contracts/config must stay unit-testable under plain node:test.
// Usage: npm run lint
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const rules = [
  { dir: 'packages/core', forbid: [/require\(['"]electron['"]\)/, /from\s+['"]electron['"]/, /require\(['"]react['"]\)/, /from\s+['"]react['"]/, /apps\/desktop\/src\/(main|renderer)/] },
  { dir: 'packages/contracts', forbid: [/require\(['"]electron['"]\)/, /from\s+['"]electron['"]/, /require\(['"]react['"]\)/, /from\s+['"]react['"]/] },
  { dir: 'packages/configuration', forbid: [/require\(['"]electron['"]\)/, /from\s+['"]electron['"]/, /require\(['"]react['"]\)/, /from\s+['"]react['"]/] },
];

let violations = 0;
for (const { dir, forbid } of rules) {
  const base = path.join(root, dir);
  if (!fs.existsSync(base)) continue;
  const files = walk(base).filter((f) => f.endsWith('.js') && !f.includes(`${path.sep}tests${path.sep}`));
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    for (const re of forbid) {
      if (re.test(src)) {
        console.error(`BOUNDARY VIOLATION ${path.relative(root, f)} matches ${re}`);
        violations += 1;
      }
    }
  }
}
if (violations > 0) { console.error(`${violations} violation(s). See AGENTS.md §2.`); process.exit(1); }
console.log('boundaries OK');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
