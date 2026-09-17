# Product Requirements — MAX Island (v1)

> Status: Proposed v1. Dokumen ini menjawab "MAX Island ini sebenarnya dibuat untuk apa?".
> Detail acceptance teknis: `docs/requirements.md` (ID FR/NFR stabil). Peta implementasi: `docs/architecture.md`. Urutan kerja: `docs/README.md` (P1→P7). Kontrak perilaku: `docs/state-machine.md`.

## 1. Product Vision

**MAX Island menyediakan contextual information dan quick actions melalui floating desktop interface tanpa mengganggu workflow pengguna.**

Satu pill overlay di top-center Windows yang selalu ada tapi tidak pernah merebut fokus: saat idle ia dorman/hilang, saat ada konteks penting (Pomodoro berjalan, track berganti, notifikasi masuk) ia muncul sekilas dalam bentuk compact/peek, dan hanya expand saat user eksplisit hover/klik. Prinsip: **glanceable, bukan interruptive**.

Visi ini diturunkan dari tiga riset: overlay Windows (`docs/window-overlay.md` + `research/2026-09-17-dynamic-island-windows.md`), state system event-driven (`research/2026-09-17-dynamic-island-state-system.md` + `docs/state-machine.md`), dan customization (`research/2026-09-17-customization-system.md`).

## 2. Problem Statement

Pengguna Windows yang kerja fokus (developer, designer, student, knowledge worker) mengalami tiga gangguan berulang:

1. **Konteks tersebar.** Timer Pomodoro di satu tab, kontrol musik di app lain (Spotify/browser), notifikasi di sudut lain. Untuk cek "tinggal berapa menit / lagu apa / notif apa" user harus context-switch (Alt-Tab, buka window) — memecah fokus.
2. **Interupsi tidak terkontrol.** Toast/notifikasi menumpuk, media player menahan overlay tetap terbuka (pelajaran Windhawk issue #4738), timer web drift saat tab ter-throttle/sleep sehingga tidak bisa dipercaya.
3. **Personalisasi kaku.** Posisi/tema/perilaku overlay tidak bisa diatur (top-center vs top-left, auto-hide, keep-on-top, modul on/off), sehingga overlay yang seharusnya membantu malah menutupi workflow.

MAX Island menyelesaikan ini dengan **satu decision point (State Manager) + satu surface (pill) + satu schema config**: semua sumber hanya emit `IslandEvent` ternormalisasi, State Manager memutuskan apa yang tampil/kapan hilang (priority + timeout + history), user mengatur semuanya via settings berversi yang apply instan tanpa reload.

## 3. Target Users

| Segmen | Ciri | Kebutuhan utama |
|---|---|---|
| Developer / Engineer | VSCode + browser + Spotify + GitHub, multi-monitor, 125–150% DPI | Pomodoro akurat, Now Playing tanpa Alt-Tab, GitHub CI mention sekilas, foreground detect (Code/Chrome) |
| Designer / Creator | Figma/browser/local player, sensitif estetika | Theme/accent/radius/transparency, animasi spring halus, compact yang tidak menutupi canvas |
| Student / Knowledge worker | Laptop Win11, Wi-Fi kampus/kantor, baterai penting | Timer survive sleep/lock, battery/online indicator, idle CPU≈0%, startup + tray sederhana |

Non-target v1: gamer fullscreen-exclusive (overlay boleh tertutup — bukan bug), pengguna yang butuh plugin pihak-ketiga / sync cloud / mobile companion.

## 4. User Goals

- UG-01: Melihat sisa Pomodoro tanpa membuka window timer (glance <1 detik).
- UG-02: Play/pause/next Spotify dan YouTube Chromium dari satu tempat tanpa API key.
- UG-03: Melihat notifikasi penting 4 detik lalu otomatis kembali ke konteks sebelumnya (Pomodoro lanjut, bukan hilang).
- UG-04: Mengatur theme/accent/posisi/ukuran/perilaku dalam <30 detik dan langsung terlihat tanpa restart.
- UG-05: Mematikan modul yang tidak dipakai (mis. microphone/AI) dan island tidak lagi menampilkannya sama sekali.
- UG-06: Tidak pernah kehilangan timer karena sleep/lock/crash — bangun tidur timer tetap benar.

## 5. Product Goals (v1, terukur di §8)

- PG-01: Satu overlay terasa bagian dari Windows (top-center di atas taskbar, pill terklik, margin click-through, DIP-benar di 100–200%+, 2 monitor).
- PG-02: Timer Pomodoro deadline-based yang dipercaya (drift <1 dtk/25 mnt, survive sleep/crash, history UTC).
- PG-03: Media generik GSMTC untuk semua app (Spotify + browser YouTube) tanpa kredensial, transient 3–5 dtk, tidak menahan island.
- PG-04: State deterministik tanpa `if/else` di renderer (priority + queue + timeout + history, burst aman).
- PG-05: Customization aman (schema berversi, gagal aman + backup, apply instan, profiles + import/export).
- PG-06: Hemat sumber daya (idle CPU≈0%, RAM ≤500 MB, animasi compositor-only ≤300 ms).

## 6. Scope (v1)

- Window: satu `BrowserWindow` frameless transparent alwaysOnTop `pop-up-menu`, dua ukuran fixed collapsed/expanded, hit-region click-through, posisi `workArea` DIP (preset + custom + pilihan monitor), opsi fullscreen `hide` default, startup + tray ICO. Ref: FR-001–FR-007 di `functional-requirements.md`, P1.
- Pomodoro: start/pause/resume/reset/skip, focus/short/long + auto-transition opsional (default off), session counter, persist + sleep/wake recovery + crash recovery, history append-only, toast + chime lokal. Ref: FR-010–FR-020, P3.
- Notification: terima/tampil/priority/timeout/restore-previous (peek 4 dtk → yield ke incumbent). Mirror OS bersyarat (consent eksplisit). Ref: FR-030–FR-034, P2+P4.
- Media: deteksi via GSMTC generik, tampil track, play/pause/prev/next, sinkron state (playing/paused/stopped/session-lost). Ref: FR-040–FR-044, P4.
- Customization: theme/accent/transparency/size/position/modules on-off/durasi Pomodoro/animasi + profiles + import/export. Ref: FR-050–FR-057, P5.
- Cross-cutting: performance + security + observability minimal (PG-06, NFR di `requirements.md`, P6). AI hanya sebagai flag `modules.ai` + slot (P7, non-fungsional di v1).

## 7. Non-Goals (eksplisit bukan v1)

- NG-01: Tembus fullscreen-exclusive game / paksa fokus di atas game (risiko anti-cheat; default `hide`).
- NG-02: Ikut pindah virtual desktop Windows (`visibleOnAllWorkspaces` return false di Windows).
- NG-03: Backdrop-blur real (Acrylic/Mica) — v1 solid/semi-solid + CSS radius; `blur` hanya flag forward-compatible.
- NG-04: Plugin runtime pihak-ketiga / dynamic `require(userPath)` / store tema (butuh RFC keamanan terpisah).
- NG-05: Mic-pasti, Wi-Fi SSID/BSSID tanpa consent, calendar sync, paksa Focus OS, brightness eksternal DDC/CI, Discord voice-state lokal, GitHub live penuh, download browser penuh, sync cloud multi-device, analytics cloud, strict-mode site blocking.
- NG-06: Mobile companion / ActivityKit iOS (hanya referensi desain).

Daftar ini mengikat: klaim di luar NG di atas adalah bug dokumentasi, bukan bug implementasi.

## 8. Success Metrics

| ID | Metric (v1 acceptance) | Target | Sumber verifikasi |
|---|---|---|---|
| SM-01 | Glance time cek timer/track | <1 dtk tanpa Alt-Tab | Uji manual shell compact |
| SM-02 | Timer accuracy aktif 25 mnt | Drift <1 dtk | Freeze 5–10 dtk → tick berikutnya benar (FR-020, NFR-07) |
| SM-03 | Sleep 2 mnt di tengah focus | Sisa = deadline − now; bila lewat → selesai + flag | Uji sleep/wake (FR-020) |
| SM-04 | Kill saat running/paused → relaunch | Lanjut/selesai tertunda; paused tetap paused | Uji crash recovery (FR-019) |
| SM-05 | Pomodoro + notif GitHub | Peek 4 dtk → kembali sisa waktu | Uji P2 (FR-034) |
| SM-06 | Burst track-change saat Pomodoro | Tidak rebut slot utama | Uji FR-044 + anti-#4738 |
| SM-07 | Spotify + YouTube Chromium control | Play/pause/next dari island | Acceptance FR-040–FR-044 |
| SM-08 | Idle collapsed 60 dtk | CPU≈0%, tanpa repaint kontinu | `getCPUUsage` + Task Manager (NFR-01) |
| SM-09 | RAM total | ≤500 MB | Task Manager + `getProcessMemoryInfo` (NFR-02) |
| SM-10 | Multi-monitor + DPI | Benar di 100/150/200%+, cabut-colok | Matriks overlay (FR-006, NFR-04) |
| SM-11 | Config korup / accent invalid / import rusak | Fallback + backup + pesan jelas, tanpa crash | Uji FR-050–FR-055 (NFR-05) |
| SM-12 | Ganti theme/accent/posisi | Instan tanpa reload (<300 ms terasa) | Uji FR-050–FR-054, FR-057 |
| SM-13 | Fullscreen-exclusive game | Overlay boleh tertutup, default `hide` | Uji FR-007 |

SM-01–SM-13 adalah definisi "selesai" produk. Angka SM-08/SM-09 adalah titik awal dari riset performance — tuning hanya via ukur, bukan opini (lihat `AGENTS.md` §7).

(End of file)
