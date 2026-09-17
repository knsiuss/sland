// Workspace integrity check: every workspace has a package.json and versions match root.
// WHY: fail fast on scaffold drift before any real build step exists (P1 adds the packager call).
// Usage: npm run build
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const rootPkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const dirs = ['apps/desktop', 'packages/core', 'packages/pomodoro', 'packages/media',
  'packages/notifications', 'packages/configuration', 'packages/contracts', 'packages/telemetry',
  'platform/windows/windowing', 'platform/windows/media', 'platform/windows/notifications',
  'platform/windows/system', 'platform/windows/native', 'integrations/spotify',
  'integrations/github', 'integrations/browser'];

let bad = 0;
for (const d of dirs) {
  const p = path.join(root, d, 'package.json');
  if (!fs.existsSync(p)) { console.error(`MISSING ${d}/package.json`); bad += 1; continue; }
  const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (pkg.version !== rootPkg.version) { console.error(`VERSION DRIFT ${d}: ${pkg.version} != root ${rootPkg.version}`); bad += 1; }
}
if (bad > 0) { console.error(`${bad} problem(s).`); process.exit(1); }
console.log(`build precheck OK (${dirs.length} workspaces @ v${rootPkg.version}); packager wiring lands in P1.`);
