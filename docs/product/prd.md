# PRD — MAX Island (v1)

> Ringkas dan mengikat. Detail di requirements/ + phase docs. Yang tidak tertulis di sini = bukan janji v1.

## Masalah

Pengguna Windows kehilangan konteks saat fokus: timer Pomodoro terpisah dari kontrol media dan notifikasi penting tenggelam. Solusi: satu island top-center yang selalu tahu apa yang paling penting ditampilkan — tanpa mencuri fokus.

## Pengguna

Pengguna Windows 10/11 (single user, lokal, tanpa cloud) yang memakai Spotify/browser + teknik Pomodoro.

## Janji v1

Overlay kecil top-center (expand/collapse + auto-hide), Pomodoro deadline-based yang survive sleep/crash, kontrol media GSMTC (Spotify + YouTube Chromium), sinyal ringan (battery/online/clipboard/foreground), settings berversi + profiles, modul on/off sebagai flags.

## Bukan janji v1

Blur/material real, ikut virtual-desktop, tembus fullscreen-exclusive, mic pasti, Wi-Fi BSSID, calendar sync, Discord voice, GitHub live, plugin pihak ketiga, AI aktif (flag off), cloud/sync, telemetri.

## Kriteria sukses

Lihat `success-metrics.md`. Pintu `v1.0.0`: roadmap + acceptance di `requirements.md`.
