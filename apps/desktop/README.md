# apps/desktop

Electron shell (maps `App/Composition/UI` → `src/{main,preload,renderer}`).

- `src/main/` — P1 window system + P3 engine host + P4 providers host + P6 infra. Only `window/` touches `BrowserWindow` (via `IslandWindowApi`).
- `src/preload/` — `contextBridge` whitelist only (`timer:intent`, `island:intent`, `config:set/get`, sync subscriptions). No fs, no `require` passthrough.
- `src/renderer/` — `shell/` renders `IslandSurfaceState` only; `settings/` form + live preview (debounced, never writes the store directly).
- `tests/e2e/` — app-scoped end-to-end; cross-cutting suites live in root `tests/`.

Rules: renderer never imports main (enforced by `npm run lint`); no `focus()` stealing; store writes only on transitions/settings change (never per render tick).
