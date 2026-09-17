# tests/security

TC-SEC-001 evidence + audit reports. Automated part: `npm run audit:security` (every PR). Manual part per release: preload surface review, `openExternal` allowlist review, secret grep over `%APPDATA%` output, permission UX walkthrough (grant/deny/revoke per provider). Findings filed as issues with `security` label — never silently fixed without a record.
