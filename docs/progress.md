# Progress — MAX Island (per Layer 0–13)

> Update: 2026-09-17. Dokumen ini dibaca tiap sesi sebelum mulai kerja.
> Aturan status: hanya naik status bila ada **bukti** (file hijau/Test lolos), bukan klaim.
> Gate: dilarang mulai Pn+1 sebelum DoD Pn hijau (lihat `docs/README.md`).

## Cara baca status

| Status | Arti |
|---|---|
| `DONE` | Selesai + terverifikasi (tes hijau / checklist manual lolos) |
| `SPEC-READY` | Spesifikasi/kontrak lengkap, belum ada kode |
| `IN-PROGRESS` | Dikerjakan, sebagian bukti sudah ada |
| `NOT-STARTED` | Belum mulai |
| `BLOCKED` | Terhenti — lihat kolom Bukti untuk sebab + jalan keluar |
| `DEFERRED` | Non-goal v1, sengaja ditunda |

## Tabel progres utama

| Layer | Cakupan | Status | Bukti | Berikutnya (DoD / aksi) |
|---|---|---|---|---|
| L0 — Engineering Foundation | Kontrak generate, phase map, struktur repo, toolchain (package.json, lint, test runner) | `DONE` (minimal) | `AGENTS.md`, `docs/README.md`, `package.json` (electron 44.4.1 pin, `node --test`), `.gitignore`, `tests/bootstrap.test.js` 2/2 PASS | Sisa L0 penuh: lint/format + CI + CODEOWNERS/CONTRIBUTING saat masuk git hosting |
| L1 — Domain / Core | Pomodoro engine (deadline-based), domain media | `SPEC-READY` | `docs/phase-3-pomodoro.md`, `research/2026-09-17-pomodoro-timer-engine.md`, ADR-001 Accepted | P3: TimerEngine + checklist freeze/sleep/kill/clock-jump (§3.3) |
| L2 — Contracts & Event System | State machine, bus→queue→reducer, kontrak event, history, timeout registry | `SPEC-READY` | `docs/state-machine.md`, `docs/phase-2-state-event.md`, `research/2026-09-17-dynamic-island-state-system.md`, ADR-003 Proposed | P2: 5 unit test §2.4 + 0-dep check `shared/events` |
| L3 — Application / Feature Services | Wiring provider → bus (GSMTC, foreground, notif-listener) | `SPEC-READY` | `docs/phase-4-system-integration.md`, `research/2026-09-17-max-island-system-application-integration.md` | Spike wajib dulu (lihat Blocker), baru P4 acceptance Spotify+YouTube |
| L4 — Infrastructure | ConfigStore (electron-store+ajv), atomic-store, logger, safe-ipc, allowlist openExternal | `SPEC-READY` | `docs/phase-5-customization.md`, `research/2026-09-17-customization-system.md`, `research/2026-09-17-system-architecture.md` (resolusi konflik ADR-004) | P5: 5 unit test config §5.3; apply tanpa reload; flag-off = drop |
| L5 — Windows Platform | Overlay window, DPI/multi-monitor, hit-region, tray, startup, fullscreen behavior | `IN-PROGRESS` | `docs/window-overlay.md`, `docs/phase-1-window-system.md`, spike foreground **lolos** (GetForegroundWindow via PowerShell, tanpa dep) | Selesaikan spike GSMTC (terpotong) + desain ulang spike toast-listener (lihat Blocker); DoD: matriks DPI/monitor/taskbar P1 |
| L6 — UI / Presentation | Island shell (dormant/compact/peek/expanded), settings UI, chime | `SPEC-READY` | `images/` (ref visual), `docs/requirements/04-ui.md`, shell/settings spec di `docs/architecture.md` | P1 shell + P5 settings; dilarang logika tampil di renderer (AGENTS.md §5) |
| L7 — Integration | Adapter statis per-app + URI launcher + allowlist | `SPEC-READY` | `docs/requirements/05-system-integration.md` (7 v1 + 7 deferred), ADR-005 Proposed | Ikut P4; tanpa dynamic loading (forbidden AGENTS.md §5) |
| L8 — Customization | Schema berversi, profiles, theme→CSS vars, feature flags | `SPEC-READY` | `docs/phase-5-customization.md`, `research/2026-09-17-customization-system.md` | P5 DoD (lihat L4) |
| L9 — Security & Privacy | Least privilege, sandbox preload, consent per capability, AI tiers | `SPEC-READY` | `docs/requirements/08-security.md`, `docs/requirements/09-privacy.md`, ADR-005/006 Proposed, `research/2026-09-17-privacy-data-requirements.md`, `research/2026-09-17-threat-model-contracts-data-model.md` | Ditegakkan tiap phase (P6 audit: nodeIntegration/require-user/openExternal/tulis-di-tick) |
| L10 — Observability & Diagnostics | Transition log (SER-007), error log provider (ERR-007), failure tables | `SPEC-READY` | `docs/state-machine.md` §5, `docs/requirements/10-error-handling.md`, `docs/architecture.md` §Error boundaries | Implementasi ikut P2 (ring buffer 50) + P4 (isolasi provider) |
| L11 — Testing & Quality | TC-010–TC-050, PERF-001, TC-SEC-001, DoD per phase | `SPEC-READY` | `docs/requirements/12-testing.md`, `docs/requirements/13-traceability.md`, DoD di tiap `phase-N-*.md` | Jalan otomatis setelah L0 toolchain hijau; aturan: TC gagal = requirement belum selesai |
| L12 — Performance | Budget CPU idle <1%, cold start <3s, throttle/polling discipline | `NOT-STARTED` | Budget di `docs/requirements/03-nonfunctional.md` + `research/2026-09-17-performance-max-island.md` (titik awal, bukan SLA) | P6: ukur idle CPU/RAM + cold start; tuning hanya via ukur |
| L13 — Packaging & Release | Installer (electron-builder), versioning, distribusi | `NOT-STARTED` | — (sengaja kosong; out-of-scope sampai P6/P7 hijau) | Keputusan setelah P6: installer vs portable; butuh signing untuk reputasi AV |

## Ringkasan angka (terverifikasi 2026-09-17)

| Metrik | Nilai |
|---|---|
| File riset `research/` | 15 + README |
| File spec `docs/` (top-level + adr + requirements) | 30 |
| File kode `src/` | 0 (skeleton folder saja) |
| File tes `tests/` | 0 (skeleton folder saja) |
| `package.json` | ada (electron 44.4.1 pin, engines node >= 20) |
| Tes berjalan | `npm test` → 2/2 PASS (`tests/bootstrap.test.js`) |
| Spike lolos | 1 (foreground-detect) |
| Spike gagal/tertunda | 2 (toast-listener, GSMTC terpotong) |
| Phase dengan DoD hijau | 0 / 7 |

Kesimpulan jujur: **fase dokumentasi v1 selesai; implementasi 0%.** Posisi saat ini = pre-P1 (spike + toolchain).

## Blocker aktif

| # | Blocker | Dampak layer | Jalan keluar |
|---|---|---|---|
| 1 | Spike GSMTC terpotong (cuma `npm init`) | L3, L5 | Rerun install + `getAllSessions` di temp; butuh media yang sedang play untuk data live |
| 2 | `UserNotificationListener` tidak resolvable dari PowerShell 5.1 | L3 (SIR-006) | Spike ulang via WinRT projection Node (`@nodert`) atau helper .NET kecil; SIR-006 tetap `v1-conditional` sampai lolos |
| 3 | `package.json` belum ada → tes tidak bisa jalan | L0, L11 | Init minimal (electron pin + `node --test`) sebelum klaim toolchain hijau |

## Changelog progres

- 2026-09-17: dokumen ini dibuat. Baseline: docs lengkap, kode 0, 0/7 phase hijau.
- 2026-09-17: L0 DONE (minimal) — `npm test` 2/2 PASS; `docs/execution-plan.md` Accepted.
- (tambah baris per perubahan status, contoh: `2026-09-XX: L0 DONE — npm test hijau`)
