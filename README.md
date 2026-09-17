# MAX Island — Dynamic Island overlay for Windows

Pomodoro + Now Playing + system glance in one top-center island. See `docs/00-product/` (PRD) and `docs/README.md` (phase map — read before writing code).

## Layout (Electron monorepo)

The original sketch used .NET names; this repo implements the same shape in Electron/JS (per ADR-002, v1 = Electron). Mapping:

| Sketch (.NET) | This repo (Electron) | Notes |
|---|---|---|
| `max-island.slnx` | root `package.json` `workspaces` | One dependency graph |
| `Directory.Build.props/.targets` | `tsconfig.base.json` + `tools/test/check-boundaries.js` | Shared compiler + boundary contract |
| `Directory.Packages.props` | root `package.json` devDependencies | Central version control; new deps need justification (AGENTS.md §4.6) |
| `global.json` | `.nvmrc` + `engines` | Node >= 20 |
| `NuGet.config` | `.npmrc` | Registry pin |
| `*.csproj` | `package.json` per package | |
| `apps/desktop` `App/Composition/UI` | `apps/desktop/src/{main,preload,renderer}` | main = App, preload = Composition (IPC), renderer = UI |
| `packages/*` `Domain/...` | same folder names in JS | `core` owns the pure event/state engine (P2) |
| `*.UnitTests` / `Desktop.E2E` | `tests/` per package + root `tests/{e2e,performance,security,architecture}` | `node:test`, no Electron for unit |

## Quickstart

```sh
npm ci        # after git init + dependency pin (P1 spike)
npm test      # L0 canary + unit suites (zero Electron)
npm run lint  # import-boundary check (core stays pure)
npm run audit:security  # forbidden-pattern grep (AGENTS.md §5)
```

## Contract order (binding)

`AGENTS.md` → `docs/README.md` (phases) → `docs/phase-N-*.md` → code. Every diff names `Phase: N` + DoD item.
