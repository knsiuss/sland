# Security Policy

Report vulnerabilities privately to the maintainers (see CODEOWNERS when git is initialized); do not open public issues for them.

Binding rules live in `docs/requirements/08-security.md` (+ `09-privacy.md`) and are enforced by `npm run audit:security` and `TC-SEC-001`:

- Least privilege, no admin, `contextIsolation:true` / `nodeIntegration:false`, minimal preload surface.
- Secrets via OS credential store (`safeStorage`/DPAPI) — never plaintext in config, logs, `.bak`, or diagnostics.
- `openExternal` allowlist only; no dynamic plugin loading in v1 (SEC-005).
- AI (P7, flag off by default): capability-based tools, tiered authorization, audit log (ADR-006).
