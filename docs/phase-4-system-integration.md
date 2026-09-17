# Phase 4 — Windows System Integration

> Scope: 3 provider generik di atas MAX Core tipis event-normalized. Bukan adapter per-app brutal.
> Sumber: `research/2026-09-17-max-island-system-application-integration.md`. Semua output masuk P2 sebagai event.

## 4.1 Arsitektur

```text
MAX Core (MediaState / SystemState / AppPresence)
├── GSMTC provider → SEMUA media (gantikan Spotify/Browser adapter spesifik)
├── Foreground provider (allowlist: Code.exe, chrome.exe, msedge.exe, discord.exe, explorer.exe) + URI launcher
└── Power/Network/FS-watcher + UserNotificationListener (consent UX)
```

Interface adapter: `{ id, match(appId/session), map(), commands[] }` + allowlist. Tanpa plugin loading dinamis di v1.

## 4.2 Matriks v1 vs deferred (jangan dijanjikan di luar ini)

| Sinyal | v1 | Catatan |
|---|---|---|
| Media semua app | ✅ GSMTC `RequestAsync→GetCurrentSession/GetSessions→Try*` + `CurrentSessionChanged`, polling 500–1000ms | Tanpa API key. Wajib acceptance Spotify + YouTube Chrome/Edge |
| Foreground + URI launch | ✅ `GetForegroundWindow/EnumWindows` via `active-win`/`get-windows` + `shell.openExternal` | Aksi launch saja, bukan state internal app |
| Battery / online-offline | ✅ `AggregateBattery/PowerManager` atau `GetSystemPowerStatus`, `NetworkInformation` | Risiko rendah |
| Notifikasi baca | ✅ bersyarat `UserNotificationListener` + consent UX | Izin dicabut = list kosong, bukan "tidak ada notif" |
| Clipboard item kini | ✅ Electron `clipboard` | Histori Win+V tidak terbaca |
| Volume | ⚠️ fase 2 | Butuh helper native Core Audio `IAudioEndpointVolume` |
| Mic pasti / Wi-Fi BSSID / Calendar sync / paksa Focus OS / brightness eksternal / Discord voice / GitHub live / download browser | ❌ tunda | Heuristik ber-confidence / deep-link / FS-watcher folder / REST bila ada token saja |

## 4.3 Definition of Done

- [ ] Spike wajib hijau: GSMTC play/pause/next/prev Spotify+YouTube; foreground detect VSCode/Chrome; toast-listen izin-ditolak vs diizinkan.
- [ ] Media-event hanya popup 3–5s (track-change/play-pause), tidak menahan island (regresi issue Windhawk #4738).
- [ ] Polling tidak agresif (media 500–1000ms, hardware throttled, bukan default agresif).

## 4.4 Non-goals

Mic-state pasti, Wi-Fi scan/BSSID (butuh location consent), brightness eksternal DDC/CI, Discord voice-state lokal, plugin dinamis (butuh RFC + threat model).
