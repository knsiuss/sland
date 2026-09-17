# 13 Traceability Matrix

> "Requirement ini implementasinya di mana dan test-nya apa?"
> Kolom Implementation = modul rencana (scaffold menunggu spike GSMTC selesai).
> Baris `deferred` tidak punya TC v1 — sengaja.

| Requirement | Design | Implementation | Test |
|---|---|---|---|
| FR-010 Start Timer | Timer Engine (ADR-001) | `src/main/pomodoro.js` | TC-010 |
| FR-011 Pause | Timer Engine (ADR-001) | `src/main/pomodoro.js` → `pause()` | TC-011 |
| FR-012 Reset | Timer Engine | `src/main/pomodoro.js` → `reset()` | TC-012 (varian reset) |
| FR-014 Durasi + siklus | Timer Engine | `src/main/pomodoro.js` | TC-010 (varian) |
| FR-015 Notifikasi selesai | Toast sendiri | `src/main/notify.js` | TC-010 (assert notif) |
| FR-020 Judul media | GSMTC provider | `src/main/providers/media.js` | TC-020 |
| FR-021 Kontrol media | Media keys OS | `src/main/providers/keys.js` | TC-021 |
| FR-022 Progress | Interpolasi lokal | `src/renderer/features/media.js` | TC-020 (assert bar) |
| FR-003 Auto-collapse 5s | State machine | `src/shared/resolver.js` + renderer | TC-030 |
| FR-033 Notif transient | Resolver transient 4s | `src/shared/resolver.js` | TC-031 |
| FR-050 Theme | Settings + tema OS | `src/renderer/styles/` + store | TC-050 |
| FR-031 Tray | Tray guard + ICO | `src/main/tray.js` | Manual |
| FR-032 Startup | `setLoginItemSettings` | `src/main/index.js` | Manual |
| NFR-PERF-001 CPU idle | Performance arch | Runtime (throttle + no-poll) | PERF-001 |
| NFR-REL-001 Provider mati | Isolasi provider | `src/main/providers/*` guard | TC-040 (varian) |
| SER-002 Resolver | ADR-003 | `src/shared/resolver.js` | TC-030, TC-031 |
| DAR-003 Atomic write | ADR-004 | `src/main/store.js` | TC-040 |
| SEC-001 Least privilege | Security arch | App manifest + preload minimal | TC-SEC-001 |
| SEC-002/003 Sandbox | Security arch | `src/main/window.js`, preload | TC-SEC-001 |
| ERR-001 Media gagal | Degradasi | `providers/media.js` fallback idle | TC-020 (varian gagal) |
| ERR-002 Notif gagal | Degradasi | Listener guard | TC-031 (varian gagal) |
| ERR-003 Store korup | Fallback default | `src/main/store.js` | TC-040 |
| ERR-004 Crash isolasi | Try/catch per provider | `src/main/index.js` wiring | TC-040 (varian) |
| CR-002 DPI | DIP layout | `src/main/window.js` | Matriks manual |
| CR-003 Multi-monitor | Display target | `src/main/window.js` | Matriks manual |
| SIR-D01 Mic pasti | — (deferred) | — | — (PVR-002 berlaku bila heuristik) |
| SIR-D02–D07 | — (deferred) | — | — |
