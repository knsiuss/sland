# Test Plan (v1)

> Pelaksanaan dari `strategy.md`. TC kanonis: `docs/requirements/12-testing.md`. Matriks manual overlay: `docs/window-overlay.md` (Win10/11, DPI, monitor, taskbar, fullscreen, RDP/VM, virtual desktop).

## Scope per phase (ikut gate AGENTS.md — tidak loncat)

| Phase | Fokus tes | DoD tes |
|---|---|---|
| P1 Window | `setSize` collapsed/expanded, hit-region click-through, posisi `workArea` DIP, tray ICO, startup | Matriks overlay hijau di mesin target |
| P2 State/Event | 5 unit contract tests resolver (ordering, preemption, history restore, timeout cancel, dedupe/overflow) | `node:test` hijau, zero-dep `shared/` terbukti |
| P3 Pomodoro | TC-010/011/012 + freeze 5–10 dtk, sleep 2 mnt, kill running/paused, clock jump ±10 mnt | Checklist verifikasi pomodoro doc hijau |
| P4 Integration | TC-020/021 + GSMTC Spotify + YouTube Chromium, izin notifikasi ditolak/diizinkan | Acceptance media hijau |
| P5 Customization | 5 config tests (migrasi, accent invalid, unknown keys, file korup, versi masa depan) + apply tanpa reload | Unit hijau + flag-off = drop event terbukti |
| P6 Perf+Sec | PERF-001, TC-SEC-001, grep audit (nodeIntegration/require-user/openExternal/tulis-di-tick) | Angka X terisi, bukan placeholder |
| P7 AI | ai-off = no-spawn + drop; no-key = no-network + launcher tetap berguna | Aturan P7 hijau |

## Matriks manual wajib (ringkas — detail di window-overlay.md)

- [ ] Skala 100 / 125 / 150 / 200%+
- [ ] 2 monitor beda DPI + cabut-colok saat expand (ERR-006)
- [ ] Taskbar atas / bawah / auto-hide
- [ ] Game fullscreen-exclusive vs borderless-windowed (default `hide`)
- [ ] RDP / VM (fallback solid, tanpa blur)
- [ ] Pindah virtual desktop (ekspektasi terdokumentasi: tidak ikut)
- [ ] Tema Windows terang/gelap (TC-050)

## Entry / exit criteria per release

- Entry: semua TC level unit + integration hijau di CI; tidak ada TC karantina tanpa issue.
- Exit: matriks manual di atas dicentang di mesin target + PERF-001 tercatat + TC-SEC-001 lolos + changelog diperbarui.
