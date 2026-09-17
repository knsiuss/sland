# Research Index — MAX Island ("What do we know?")

> Indeks 1 halaman sesuai rekomendasi deep-research 2026-09-17: tidak ada `research.md` konsolidasi baru (hindari duplikasi). Baseline = 9 decision docs di bawah + `docs/window-overlay.md` + `docs/requirements.md` + `docs/architecture.md`.

| Dimensi | Dokumen |
|---|---|
| Windows APIs + overlay constraints | `2026-09-17-dynamic-island-windows.md`, `../docs/window-overlay.md` |
| iOS/macOS mechanism + existing products | `2026-09-17-dynamic-island-ios-macos-mekanisme.md` |
| State/event system + UX (priority, queue, timeout) | `2026-09-17-dynamic-island-state-system.md` |
| Pomodoro engine + timer constraints | `2026-09-17-pomodoro-timer-engine.md` |
| Performance characteristics | `2026-09-17-performance-max-island.md` |
| System/app integration + feasibility matrix | `2026-09-17-max-island-system-application-integration.md` |
| Customization + security (no-plugin v1) | `2026-09-17-customization-system.md` |
| MVP scope (brutal-cut) | `2026-09-17-mvp-definition-v01.md` |
| Privacy + data requirements | `2026-09-17-privacy-data-requirements.md` |

Risiko tertinggi (bukan feasibility overlay): salah pilih SMTC-only, janji blur/material tanpa fallback, polling/`rAF` agresif saat idle, focus-stealing. Celah tersisa = verifikasi lokal, bukan dokumen baru: spike GSMTC (Spotify + YouTube Chromium), matriks overlay (Win10/11, DPI 100–200%+, 2 monitor, game exclusive vs borderless, RDP/VM), ukur idle 60 detik sebelum budget jadi SLA.

(End of file)
