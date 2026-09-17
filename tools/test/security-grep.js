// Security grep (zero-dep): fail on forbidden patterns, warn on risky ones needing review.
// WHY: cheap automated backstop for AGENTS.md §5 + TC-SEC-001 until a full audit step exists.
// Usage: npm run audit:security
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const scanRoots = ['apps', 'packages', 'platform', 'integrations', 'tools'];
const failOn = [
  /nodeIntegration\s*:\s*true/,
  /require\(\s*userPath\s*\)/,
  /require\(\s*[^'"]/, // dynamic require (non-literal) — flag for review as failure, narrow later
  /\beval\s*\(/,
];
const warnOn = [/openExternal\s*\(/, /child_process/, /disableHardwareAcceleration/];

let failures = 0;
for (const r of scanRoots) {
  const base = path.join(root, r);
  if (!fs.existsSync(base)) continue;
  for (const f of walk(base).filter((f) => f.endsWith('.js'))) {
    if (f === __filename) continue; // this scanner intentionally uses a dynamic-ish pattern set
    const src = fs.readFileSync(f, 'utf8');
    for (const re of failOn) {
      if (re.test(src)) { console.error(`SEC-FAIL ${path.relative(root, f)} matches ${re}`); failures += 1; }
    }
    for (const re of warnOn) {
      if (re.test(src)) console.log(`SEC-WARN ${path.relative(root, f)} matches ${re} (needs allowlist/review note)`);
    }
  }
}
if (failures > 0) { console.error(`${failures} security failure(s).`); process.exit(1); }
console.log('security grep OK');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
