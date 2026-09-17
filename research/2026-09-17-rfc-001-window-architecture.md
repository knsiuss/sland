# RFC-001: MAX Island Window Architecture (WinUI 3 vs WPF vs Electron vs Tauri)

- **Tanggal:** 2026-09-17
- **Status:** Proposed (menguji ulang ADR-002; belum mengubah keputusan)
- **Scope:** satu floating shell top-center (borderless transparent always-on-top di atas taskbar, pill-klikabel + margin click-through, posisi `workArea`/DIP, startup+tray, kontrol media GSMTC). v1, Windows 10 17763+ / 11.
- **Out-of-scope:** desain visual final, distribusi Store vs installer, scope media/calendar/AI penuh, angka SLA perf.
- **Keputusan yang diuji:** apakah ada opsi yang menggulingkan ADR-002 (Accepted: Electron) untuk v1?

## Context

ADR-002 menerima Electron untuk v1 dengan alasan iterasi UI cepat + wrapper GSMTC Node yang terbukti, sambil mencatat Tauri/native sebagai evaluasi-tertunda. RFC ini menutup celah evidence ADR-002: dua kandidat yang belum diuji setara (WinUI 3, WPF) dievaluasi dengan bukti proporsional terhadap risiko — karena salah pilih stack di awal = rewrite total shell, window manager, dan seluruh provider media.

## Problem

Shell butuh tiga properti sekaligus, dan ketiganya harus jalan bersamaan:

1. **Per-pixel click-through selektif** — pill bisa diklik, margin transparan lolos ke window bawah (bukan satu mode untuk seluruh window).
2. **Positioning DPI-aware** — top-center dari `workArea` dalam DIP, benar di 100–250% + multi-monitor + cabut-colok.
3. **Kontrol media pihak ketiga tanpa plugin browser** — GSMTC (`GetCurrentSession`/`GetSessions` + `Try*`), bukan SMTC-only.

## Constraints

- Tanpa admin/UAC (SEC-002). Tanpa private API. Iterasi UI cepat di v1 lebih berharga dari bundle kecil.
- v1 primary-monitor-tolerant, bukan multi-monitor-perfect; tapi stack tidak boleh menutup jalan ke sana.
- Bukti = docs primer + issue tracker resmi per 2026-09-17; belum ada build test lokal (lihat Open Questions).

## Requirement → Options → Trade-off → Decision

```text
Requirement (P1 shell + kontrol GSMTC, tanpa admin)
    ↓
Option A Electron  |  Option B Tauri v2  |  Option C WPF  |  Option D WinUI 3
    ↓
Trade-off (lihat tabel §Alternatives)
    ↓
Decision: PERTAHANKAN ADR-002 (Electron v1). Tidak ada temuan yang menggulingkannya.
Alasan penentu: satu-satunya stack dengan pola click-through-selektif
terdokumentasi primer + wrapper GSMTC siap pakai + iterasi web.
```

## Proposed Solution

Lanjut Electron untuk v1 persis konfigurasi `docs/window-overlay.md` + `docs/phase-1-window-system.md` (`frame:false, transparent:true, resizable:false, skipTaskbar:true, alwaysOnTop, level:'pop-up-menu'`, dua ukuran fixed, hit-region toggle `setIgnoreMouseEvents(ignore,{forward:true})` via pola IPC resmi `set-ignore-mouse-events` + `mouseenter`/`mouseleave`). Media via `windows-media-sessions` (bridge stdio ke backend .NET self-contained, tanpa node-gyp, kompatibel Electron-main). Tidak perlu spike stack baru — spike yang sudah direncanakan (overlay-matrix + GSMTC) tetap jalan.

## Alternatives (evidence)

### A. Electron — PERTAHANKAN (v1)

- **[Fakta]** Pola resmi frameless window + `setIgnoreMouseEvents(ignore, {forward:true})` + tutorial interaksi custom tersedia di docs/primer; implementasi native memakai `WS_EX_TRANSPARENT|WS_EX_LAYERED` untuk jalur ignore (terobservasi di `native_window_views.cc`).
- **[Fakta]** Limitasi terdokumentasi dan sudah diterima di ADR-002: tidak ada click-through default pada piksel transparan, transparent window tidak reliably resizable, `blur()` CSS hanya di dalam web contents.
- **[Inferensi]** Satu-satunya opsi dengan jalur per-pixel selektif yang first-class + wrapper media siap pakai. Biaya: bundle 100MB+, memori lebih besar (diterima sadar, evaluasi ulang hanya via ukur).

### B. Tauri v2 — DITUNDA (deferred, bukan ditolak permanen)

- **[Fakta]** API `decorations:false + transparent + alwaysOnTop + skipTaskbar + setIgnoreCursorEvents(ignore)` ada, tetapi **tanpa opsi `forward`** — request-nya masih issue terbuka (#6164); per-pixel passthrough ditolak/wont-fix (#13070, #2090); workaround resmi = poll cursor global dari Rust + toggle `setIgnoreCursorEvents` berdasar hit-box test.
- **[Opini sumber]** Klaim bundle kecil (TechLogHub 2026) dan anekdot overlay 60fps + focus-steal fixes (Manasight 2026) — klaim sekunder, bukan hasil ukur kami.
- **[Inferensi]** Jalur click-through = re-implementasi manual yang rapuh (poll + toggle) + biaya Rust + re-validasi wrapper GSMTC/sidecar. Baru dipertimbangkan jika bundle/memory jadi blocker **terukur**.

### C. WPF — DITOLAK untuk v1

- **[Fakta]** `AllowsTransparency + WindowStyle=None + Topmost`: OS RIT melewatkan piksel layered yang 100% transparan; tetapi `AllowsTransparency` harus diset sebelum `Show` (coerced di `Window.cs`), `WS_EX_TRANSPARENT` membuat **seluruh** window passthrough — selektif pill-vs-margin butuh toggling style atau hack dua-HWND; kombinasi `ShowInTaskbar=False + Topmost` punya bug z-order hidden-owner yang butuh workaround `SetWindowPos`.
- **[Inferensi]** Kehilangan stack web (iterasi lambat) + Win32 toggling manual. Peringkat kedua setelah Electron, tapibiaya > manfaat untuk v1.

### D. WinUI 3 — DITOLAK untuk v1 (friksi tertinggi)

- **[Fakta]** Composition/DirectComposition berkonflik dengan `WS_EX_LAYERED`/`SetLayeredWindowAttributes` (issue resmi ditutup by-design #8469); click-through transparan butuh sampel `SwapChainPanel` layered + `WS_EX_TRANSPARENT` (seluruh window) atau `SetWindowRgn`/`CombineRgn` manual per kontrol — dan `IsAlwaysOnTop` merusak sampel tersebut; `AppWindow` hanya menawarkan presenter `Overlapped/CompactOverlay/FullScreen` + flag `IsAlwaysOnTop`, tanpa API passthrough per-pixel.
- **[Inferensi]** Region management aktif (per resize/DPI/dialog) + konflik komposisi = biaya perawatan tertinggi. Tidak cocok untuk shell yang morph collapsed↔expanded.

### Ringkasan trade-off

| Kriteria | Electron | Tauri v2 | WPF | WinUI 3 |
|---|---|---|---|---|
| Click-through selektif (pill vs margin) | ✅ pola primer | ⚠️ poll+toggle manual | ⚠️ toggle style / 2-HWND | ❌ region manual + konflik komposisi |
| DIP/workArea positioning | ✅ (`screen`, DIP) | ✅ | ✅ | ✅ |
| GSMTC siap pakai | ✅ (`windows-media-sessions`) | ⚠️ re-validasi sidecar | ✅ (C# langsung) | ✅ (C# langsung) |
| Iterasi UI v1 | ✅ web | ✅ web | ❌ XAML | ❌ XAML |
| Bundle/runtime | ❌ 100MB+ | ✅ kecil | netral | netral |
| Biaya stack baru | nol (dipilih) | Rust + re-validasi | rewrite + Win32 hack | rewrite + region mgmt |

## Trade-offs (yang diterima sadar)

Mempertahankan Electron = menerima bundle besar + memori lebih tinggi + overlay bisa tertutup fullscreen-exclusive + satu virtual desktop (semua sudah di ADR-002 §Consequences). Harga ini dibayar untuk: nol rewrite, pola click-through yang terbukti, dan wrapper media yang sudah dipakai dua repo referensi (Winisland, Dynamic_island).

## Risks

| # | Risiko | Mitigasi |
|---|---|---|
| 1 | Temuan ini docs-only, belum build test (DPI matrix, fullscreen-exclusive, RDP/VM belum dijalankan) | Spike overlay-matrix P1 tetap wajib sebelum klaim "terasa bagian Windows" |
| 2 | Versi exact Electron/Node/backend belum di-pin | Open decision #1 di `architecture.md` — pin dari docs primer sebelum koding |
| 3 | Klaim sekunder pro-Tauri (bundle/60fps) belum terukur | Hanya dibuka ulang via angka ukur idle CPU/RAM/startup (P6), bukan opini |
| 4 | GSMTC Node wrapper berubah API | Isolasi di provider (`main/system`), kontrak event P2 tidak berubah |

## Migration

Tidak ada migrasi — keputusan = tidak berubah (ADR-002 tetap Accepted). Jika P6 mengukur blocker: jalur keluar = spike Tauri terpisah (sidecar GSMTC + hit-box poll + uji matrix yang sama) dengan RFC-002, bukan migrasi diam-diam. Kontrak P2 (event) dan P5 (config) dirancang stack-agnostic agar shell bisa diganti tanpa menyentuh reducer.

## Open Questions

1. Pin versi Electron/Node/`windows-media-sessions`/`electron-store` dari docs primer (milik builder P1).
2. Hasil matrix overlay lokal (Win10/11, 100–250%, 2 monitor, taskbar posisi, game exclusive vs borderless, RDP/VM, virtual desktop).
3. Angka idle CPU/RAM/cold-start terukur sebagai baseline P6 (pengganti klaim vendor).

## Sources

- Electron frameless window fiddle — https://github.com/electron/electron/blob/main/docs/fiddles/windows/manage-windows/frameless-window/index.html
- Electron `native_window_views.cc` (`SetIgnoreMouseEvents`/`SetFocusable`) — https://github.com/electron/electron/blob/main/shell/browser/native_window_views.cc
- Tauri v2 window JS API (`setIgnoreCursorEvents`) — https://v2.tauri.app/reference/javascript/api/namespacewindow/
- Tauri click-through wont-fix #13070 — https://github.com/tauri-apps/tauri/issues/13070
- Tauri `forward` option request #6164 — https://github.com/tauri-apps/tauri/issues/6164
- WinUI 3 `SetLayeredWindowAttributes` by-design #8469 — https://github.com/microsoft/microsoft-ui-xaml/issues/8469
- WinUI 3 input passthrough discussion #10746 — https://github.com/microsoft/microsoft-ui-xaml/discussions/10746
- Manage app windows with AppWindow — https://learn.microsoft.com/en-us/windows/apps/develop/ui/manage-app-windows
- WPF transparent windows hit-testing — https://learn.microsoft.com/en-us/archive/blogs/dwayneneed/transparent-windows-in-wpf
- WPF `Window.cs` (`AllowsTransparency`/`Topmost`) — https://github.com/dotnet/wpf/blob/48dfd1e6/src/Microsoft.DotNet.Wpf/src/PresentationFramework/System/Windows/Window.cs
- GSMTC SessionManager — https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssessionmanager?view=winrt-26100
- `windows-media-sessions` npm — https://www.npmjs.com/package/windows-media-sessions
- `windows-media-sessions` backend — https://github.com/Gyom03/windows-media-sessions
- Tauri overlay anecdote 2026 (sekunder) — https://blog.manasight.gg/why-i-chose-tauri-v2-for-a-desktop-overlay/
- Baseline lokal: `docs/adr/002-window-technology.md`, `docs/window-overlay.md`, `docs/requirements.md`

(End of file)
