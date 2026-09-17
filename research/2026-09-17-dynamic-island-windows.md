# Decision Document — Dynamic Island di Windows (Pomodoro + Kontrol Aktivitas/Musik)

- **Tanggal:** 2026-09-17
- **Topik:** Overlay "Dynamic Island" top-center di Windows 10/11 untuk Pomodoro + kontrol aktivitas (music/now-playing) + info sistem
- **Status:** Proposed (riset awal, belum ada implementasi/diverifikasi lokal)
- **Scope:** Stack overlay yang viable + API untuk baca/kontrol media pihak ketiga tanpa plugin browser
- **Out-of-scope:** Desain visual final, full PRD, pilihan distribusi Store vs installer

## Executive Summary

Bangun v1 di **Electron (frameless + transparent + alwaysOnTop, top-center, `resizable:false`, single-instance)** + baca/kontrol media via **GSMTC wrapper (`windows-media-sessions`)** dengan polling 500–1000ms + event `CurrentSessionChanged`. Pomodoro sebagai **state-machine lokal** (focus/short-break/long-break + countdown + notifikasi) yang mengambil slot collapsed-state saat berjalan. Auto-hide default kecuali timer/media-event aktif 3–5 detik. Batasi v1 ke **primary monitor** + simpan settings di `%APPDATA%`. Evaluasi Tauri hanya jika bundle-size jadi blocker.

## Konteks

Kebutuhan user: Dynamic Island ala iPhone tapi di Windows. Fungsi awal: Pomodoro + kontrol aktivitas seperti musik dan lain-lain.

Pertanyaan keputusan yang dijawab dokumen ini:
1. Pola overlay apa yang terbukti jalan di Windows untuk island top-center collapse/expand?
2. API apa yang benar untuk membaca + mengontrol Spotify/browser/YouTube tanpa plugin browser?
3. Risiko terbesar apa yang harus dihindari di v1?

## Findings (Evidence)

### 1. Pola overlay yang terbukti — Electron transparent frameless always-on-top

**[Fakta]** Repo `onurgnll/Winisland` adalah overlay Electron transparan frameless always-on-top, modul Clock/Media/Timer/Notes/Audio-Bluetooth/Calendar, media via `windows-media-sessions`, persistensi di `%APPDATA%`, placement top-center + drag-snap ke edge.

**[Fakta]** Repo `Avenger11764/Dynamic_island` pola sama (Electron+React): Spotify integration, Pomodoro/Stopwatch yang menggantikan clock saat collapsed, CPU/RAM/network live, volume/brightness via scroll, single-instance + autostart.

**[Fakta]** Pola resmi Electron untuk ini: `new BrowserWindow({ frame:false, transparent:true, alwaysOnTop:true, resizable:false })` + CSS `-webkit-app-region: drag/no-drag`.

**[Fakta]** Limitasi terdokumentasi Electron untuk pola ini:
- Tidak bisa click-through area transparan secara default
- Transparent window tidak reliably resizable
- `blur()` hanya di dalam web contents, bukan konten di belakang window
- Tidak bisa maximize via system menu / double-click titlebar di Windows

Implikasi: desain island harus fixed-size (collapsed vs expanded dua ukuran), bukan resize bebas. Area drag vs klik harus eksplisit via CSS region.

### 2. Alternatif native — Windhawk + Direct2D

**[Fakta]** Mod Windhawk `dynamic-island-for-windows` memakai rendering native Direct2D hardware-accelerated, interaksi hover-expand + scroll untuk ganti tab Media/Calendar/Weather, modul Media/Clipboard/Battery/Camera-Mic indicator.

**[Inferensi]** Jalur ini paling ringan secara runtime, tapi biaya pengembangannya beda kelas (C++/native, terikat ke Windhawk host, bukan app standalone). Tidak cocok untuk v1 jika target adalah app sendiri yang mudah di-iterate dengan web UI. Cocok dijadikan referensi UX (hover-expand, scroll-ganti-tab, auto-hide).

### 3. API media yang benar — GSMTC, bukan SMTC saja

Ini titik keputusan paling berisiko salah.

**[Fakta]** Untuk membaca/mengontrol app lain (Spotify, browser/YouTube) API-nya adalah `Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager` (GSMTC): alur `RequestAsync() -> GetCurrentSession()/GetSessions() -> TryTogglePlayPauseAsync/TryPlay/TryPause/TrySkipNext/Previous + media properties + timeline`.

**[Fakta]** `Windows.Media.SystemMediaTransportControls` (SMTC) saja adalah untuk mem-publish playback milik sendiri, bukan untuk discovery app lain. Sampel `microsoft/dynwinrt samples/js/electron-smtc` menegaskan pembagian peran SMTC vs GSMTC ini.

**[Fakta]** Di Node/Electron aksesnya via wrapper seperti `windows-media-sessions` (dipakai Winisland) atau `@nodert-win11/windows.media.control`.

**[Inferensi]** Jika salah pilih SMTC-only, hasilnya island hanya bisa menampilkan status palsu/buatan sendiri, tidak bisa mengontrol Spotify/browser. Ini failure mode #1 yang harus dihindari. Validasi v1 wajib: play/pause/next/previous Spotify + Chromium-browser (YouTube) dari island.

### 4. Pomodoro tidak butuh OS API khusus

**[Inferensi]** Pomodoro tidak butuh OS API khusus; risiko utamanya adalah drift/throttling saat sleep + notifikasi + persistensi state, bukan feasibility.

Artinya:
- Implementasikan sebagai state-machine lokal: `idle/focus/short-break/long-break`, countdown, auto-transition, notifikasi Windows, suara opsional.
- Simpan state + settings di `%APPDATA%` agar survive restart.
- Uji edge: laptop sleep/hibernate, throttling timer saat window tidak fokus, dan transisi antar sesi.
- Saat Pomodoro berjalan, ia mengambil slot collapsed-state (menggantikan clock), mengikuti pola repo `Avenger11764/Dynamic_island`.

### 5. Risiko UX yang sudah dilaporkan orang lain

**[Fakta]** Issue Windhawk `#4738`: modul Media menahan island tetap terbuka dan mengalahkan `AutoHideIdleSeconds`, padahal ekspektasi harusnya hanya popup sementara saat track-change/play-pause.

**[Fakta]** Laporan yang sama: kontrol rusak saat pindah monitor/laptop + scaling 250% di 4K, mengindikasikan risiko multi-monitor/DPI hit-testing.

Implikasi untuk v1:
- Auto-hide default: collapse kecuali (a) timer berjalan, atau (b) media-event aktif 3–5 detik, atau (c) hover/focus.
- Jangan polling agresif. Batasi ke primary monitor dulu untuk hindari bug DPI/multi-monitor di v1.

### 6. Electron vs Tauri

**[Opini sumber]** Perbandingan TechLogHub 2026 mengklaim Tauri bundle single-digit MB dan memori jauh lebih rendah vs Electron 100MB+ karena WebView2 native, tetapi dengan risiko inkonsistensi rendering antar-webview dan ekosistem lebih kecil; Electron dinilai lebih mature/konsisten. Ini klaim sumber sekunder, bukan hasil ukur kami.

**[Inferensi]** Untuk v1 yang butuh kecepatan iterasi UI + wrapper GSMTC Node yang sudah terbukti di Winisland, Electron adalah pilihan pragmatis. Tauri baru dipertimbangkan jika bundle-size/memory menjadi blocker yang terukur, karena pindah ke Tauri menambah biaya Rust/WebView2 + risiko kompatibilitas wrapper media.

## Options Considered

| Opsi | Kelebihan | Kekurangan | Verdict |
|------|-----------|------------|---------|
| **A. Electron frameless transparent alwaysOnTop + `windows-media-sessions` (GSMTC)** | Terbukti di 2 repo, ekosistem besar, iterasi UI cepat (React), wrapper media siap pakai | Bundle 100MB+, memori lebih besar | **Pilih untuk v1** |
| B. Tauri + WebView2 | Bundle kecil, memori rendah | Ekosistem lebih kecil, risiko rendering antar-webview, wrapper GSMTC perlu validasi ulang | Cadangan jika size jadi blocker |
| C. Native Windhawk mod (C++/Direct2D) | Paling ringan, hardware-accelerated | Bukan app standalone, biaya native tinggi, iterasi lambat | Referensi UX saja, bukan basis v1 |

## Decision / Rekomendasi v1

1. **Shell:** Electron `frame:false, transparent:true, alwaysOnTop:true, resizable:false`, single-instance + autostart, posisi top-center, dua ukuran fixed (collapsed/expanded).
2. **Media:** GSMTC via `windows-media-sessions`, polling 500–1000ms + event `CurrentSessionChanged` saja. Jangan polling cepat. Tampilkan title/artist/artwork + play/pause/next/previous + timeline.
3. **Pomodoro:** state-machine lokal + notifikasi. Saat berjalan, tampil di collapsed-state.
4. **Auto-hide:** default collapse; expand hanya saat hover/klik, timer aktif, atau media-event 3–5 detik.
5. **Scope v1:** primary monitor only, Spotify + Chromium-browser, settings di `%APPDATA%`.
6. **Non-goal v1:** multi-monitor/DPI-perfect, Store distribution, widget cuaca/kalender penuh.

## Risiko + Mitigasi

1. **Salah API (SMTC vs GSMTC)** → Mitigasi: wajib pakai GSMTC `GetCurrentSession/GetSessions` + `Try*` controls; acceptance test lawan Spotify + YouTube di Chrome/Edge.
2. **Z-order / focus-stealing di fullscreen/game** → Mitigasi: uji alwaysOnTop di fullscreen-exclusive game dan window elevated (UAC); sediakan toggle "sembunyikan saat fullscreen".
3. **CPU drain karena polling media/hardware** → Mitigasi: polling 500–1000ms saja + event-driven; CPU/RAM/network opsional dan throttled, bukan default agresif.
4. **DPI/multi-monitor hit-testing** → Mitigasi: v1 primary monitor; simpan posisi relatif dengan DPI-aware; uji 100%/150%/250% scaling.
5. **Timer drift saat sleep/throttle** → Mitigasi: hitung berbasis timestamp (end-time), bukan tick counter; persist state; koreksi saat resume.

## Assumptions & Limitations

- Asumsi Windows 10 17763+ / 11 + WebView2/Chromium modern.
- Asumsi target Spotify + Chromium-browser yang sudah mendaftar ke GSMTC.
- Belum verifikasi kode lokal/instalasi; belum uji perilaku alwaysOnTop di fullscreen-exclusive game dan UAC-elevated window.
- Versi exact Electron/Node/wrapper belum di-pin dan perlu verifikasi builder dari docs primer sebelum koding.

## Next Steps (tanpa ubah code di doc ini)

1. Pin versi Electron/Node/`windows-media-sessions` dari docs primer.
2. Buat spike: window frameless transparent + GSMTC play/pause Spotify + YouTube.
3. Buat spike Pomodoro state-machine + notifikasi + persist `%APPDATA%`.
4. Uji acceptance: auto-hide 3–5 detik, primary monitor, scaling 150%/250%.

## Sources

- Winisland repo — https://github.com/onurgnll/Winisland
- Dynamic_island Electron+Pomodoro+Spotify repo — https://github.com/Avenger11764/Dynamic_island
- Dynamic Island for Windows Windhawk — https://windhawk.net/mods/dynamic-island-for-windows
- Media Player auto-hide issue #4738 — https://github.com/ramensoftware/windhawk-mods/issues/4738
- Electron Custom Window Styles — https://www.electronjs.org/docs/latest/tutorial/custom-window-styles
- GlobalSystemMediaTransportControlsSessionManager API — https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssessionmanager?view=winrt-28000
- Manual control of SMTC — https://learn.microsoft.com/en-us/windows/apps/develop/media-playback/system-media-transport-controls
- Query/control system media Old New Thing — https://devblogs.microsoft.com/oldnewthing/20231108-00?p=108980
- dynwinrt electron-smtc sample — https://github.com/microsoft/dynwinrt/tree/main/samples/js/electron-smtc
- Tauri vs Electron 2026 comparison — https://techloghub.com/compare/tauri-vs-electron
