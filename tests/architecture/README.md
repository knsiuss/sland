# tests/architecture

Executable architecture rules (ouverte on CI via `architecture.yml`):

1. `packages/core` (+`contracts`, `configuration`) import nothing from Electron/React/app layers (`npm run lint`).
2. Renderer never imports main — communication via preload whitelist only (grep + review).
3. Single `BrowserWindow` owner: only `platform/windows/windowing` references `BrowserWindow` (grep).
4. No new runtime dependency in `packages/core` — ever (its `package.json` must stay dependency-free).

Rule changes require an ADR, not a quiet edit.
