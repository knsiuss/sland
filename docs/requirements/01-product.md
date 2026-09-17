# 01 Product Requirements

## Visi

Satu floating UI top-center di Windows yang terasa seperti bagian dari OS:
Pomodoro + Now Playing + jam + status sistem sekilas, tanpa mencuri fokus.

## Pengguna

Pengguna Windows 10/11 (laptop, 1–2 monitor) yang kerja dengan musik +
butuh timer fokus tanpa buka-tutup aplikasi.

## Scope v1 (wajib)

- PROD-001: Island collapse/expand fixed-size, always-on-top, tidak di taskbar.
- PROD-002: Pomodoro 25/5/15 + siklus long-break tiap 4 sesi + notifikasi selesai.
- PROD-003: Now Playing semua app via GSMTC + kontrol play/pause/next/prev.
- PROD-004: Jam + status sistem ringan (baterai, online/offline).
- PROD-005: Berjalan dari tray + opsi startup Windows.

## Non-goals v1 (dilarang dijanjikan)

- PROD-NG-001: Tembus fullscreen-exclusive game.
- PROD-NG-002: Ikut pindah virtual desktop.
- PROD-NG-003: Backdrop-blur real (Acrylic/Mica tembus-desktop).
- PROD-NG-004: `MIC ACTIVE` pasti / Wi-Fi detail / calendar sync / Discord voice-state.
- PROD-NG-005: Plugin pihak ketiga / cloud AI.

## Kriteria sukses v1

- PROD-S-001: 7 hari dipakai tanpa crash dan tanpa restart paksa.
- PROD-S-002: Semua FR status `v1` lolos TC-nya di matriks `13-traceability.md`.
