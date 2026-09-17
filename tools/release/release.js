// Release gate: version consistency + changelog entry check for a tag.
// WHY: releases fail embarrassingly on version drift; check it before packaging.
// Usage: node tools/release/release.js v0.1.0
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const tag = process.argv[2];
if (!/^v\d+\.\d+\.\d+$/.test(tag || '')) { console.error('usage: node tools/release/release.js vX.Y.Z'); process.exit(1); }
const version = tag.slice(1);
const root = path.join(__dirname, '..', '..');
const rootPkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (rootPkg.version !== version) { console.error(`root package.json is ${rootPkg.version}, tag is ${tag}`); process.exit(1); }
const changelog = fs.readFileSync(path.join(root, 'docs', 'releases', 'changelog.md'), 'utf8');
if (!changelog.includes(`[${version}]`)) { console.error(`docs/releases/changelog.md has no [${version}] section`); process.exit(1); }
console.log(`release gate OK for ${tag}`);
