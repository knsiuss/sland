# Decision Document — Mekanisme Dynamic Island iOS vs macOS

- **Tanggal:** 2026-09-17
- **Topik:** Cara kerja Dynamic Island di iOS vs macOS (mekanisme sistem, bukan desain UI detail)
- **Status:** Proposed (riset mekanisme, belum verifikasi kode lokal)
- **Scope:** Menentukan pendekatan implementasi yang benar (native system API vs overlay emulasi)
- **Out-of-scope:** Desain visual final, porting 1:1, pilihan distribusi

## Executive Summary

iOS = UI sistem privileged di sekitar pill TrueDepth, app hanya suplai view via ActivityKit + WidgetKit, lifecycle dipegang sistem. macOS = tidak ada API resmi, semua "Dynamic Island for Mac" adalah overlay user-space (borderless transparent click-through, anchor ke notch). Untuk `island-dynamic` sebagai overlay: tiru state model + spring morph + event router, jangan tiru ActivityKit/APNs. Untuk iOS native: wajib via ActivityKit + Widget Extension.

## Konteks

Pertanyaan: bagaimana mekanisme cara kerja Dynamic Island di Mac atau iOS?

Keputusan yang dijawab: apakah implementasi harus pakai native system API atau overlay emulasi, tergantung target platform.

## Findings (Evidence)

### 1. iOS — Privileged system compositor, bukan custom view

**[Fakta]** iOS Dynamic Island adalah UI sistem di sekitar pill TrueDepth (iPhone 14 Pro+). Tidak ada API publik untuk menggambar pil-nya langsung.

**[Fakta]** App hanya menyuplai view via `ActivityConfiguration + WidgetKit + SwiftUI` dengan variant `compactLeading/compactTrailing, minimal, expanded + Lock Screen`.

**[Fakta]** Lifecycle dipegang `ActivityKit`: `Activity.request/update/end` lokal saat foreground, atau ActivityKit push via APNs saat background. Model data dipisah `ActivityAttributes` (statis) vs `ContentState` (dinamis).

**[Fakta]** Sistem yang memilih presentasi: compact jika 1 aktivitas aktif, minimal jika 2 aktivitas aktif (satu attached, satu detached), expanded saat alert/long-press/tap.

**[Fakta]** Batasan terdokumentasi: aktif maks ~8 jam lalu otomatis diakhiri dan dihapus dari Island. Tap deep-link via `widgetURL`. HIG mencatat corner radius 44pt dan lebar compact/minimal 230-250pt tergantung model iPhone.

**[Fakta]** Live Activity yang sama otomatis diproyeksikan ke Lock Screen, StandBy, Smart Stack Apple Watch, CarPlay, dan menu bar Mac — bukan Island di Mac.

Implikasi: di iOS tidak bisa bikin "island sendiri". Harus ikut aturan sistem: request activity, update ContentState, biarkan sistem pilih compact/minimal/expanded.

### 2. macOS — Tidak ada API resmi, semua overlay user-space

**[Fakta]** Apple tidak menyediakan Dynamic Island API di macOS.

**[Fakta]** Semua "Dynamic Island for Mac" (DynamicNotch, NotchDock, Notchify, Notchy) adalah overlay user-space: `NSPanel/NSWindow` borderless transparan click-through yang di-anchor ke notch, dirender di atas semua window dengan SwiftUI+AppKit+Core Animation spring, plus Event Monitor yang polling system events (Now Playing via private `MediaRemote.framework`, timer, clipboard, baterai, notifikasi).

**[Fakta]** Butuh permission per-fitur: Accessibility, Screen Recording, Apple Events, Bluetooth.

Implikasi: klon Mac = app biasa yang pura-pura jadi system UI. Harus handle sendiri: positioning di notch, click-through saat collapsed, expand saat hover/klik, permission, dan polling event.

### 3. Klaim performa vendor — perlakukan sebagai aspirasi

**[Opini sumber]** Klaim "0.3% CPU, 120Hz ProMotion, jelly morph persis iOS" dari situs marketing klon Mac adalah klaim vendor tanpa benchmark independen — perlakukan sebagai aspirasi, bukan fakta.

### 4. Model mental pemersatu

**[Inferensi]** iOS = privileged system compositor + lifecycle terkontrol; Mac/web clone = state machine `dormant/minimal/compact/expanded` + animasi spring + event router dengan priority scoring. Keduanya terlihat mirip tapi mekanismenya tidak interchangeable.

Pola klon (Alcove Notch dkk): state model Dormant/Minimal/Compact/Expanded + pemicu expand (hover/click/alert/timer) + spring morph collapsed↔expanded + click-through saat collapsed.

## Options Considered

| Target | Mekanisme benar | Verdict |
|--------|-----------------|---------|
| iOS native | ActivityKit + Widget Extension, `Activity.request/update/end`, variant compact/minimal/expanded | Wajib jika target iOS |
| macOS / Windows overlay | Borderless transparent always-on-top + anchor ke notch/top-center + spring animation + event router + click-through saat collapsed | Pilih untuk `island-dynamic` sebagai overlay |
| Web mimic | Div fixed top-center + CSS spring/transition, state machine JS | Hanya untuk demo/prototype, bukan system integration |

## Decision / Rekomendasi

1. **Jika target `island-dynamic` sebagai overlay (Windows/macOS/web):** jangan tiru ActivityKit/APNs. Tiru hanya: state model 4-state + pemicu expand (hover/click/alert/timer) + spring morph collapsed↔expanded + click-through saat collapsed.
2. **Jika target iOS native:** wajib via ActivityKit + Widget Extension, bukan custom view di sekitar notch.
3. Keputusan builder berikutnya yang dibutuhkan: tetapkan target platform `island-dynamic` (iOS native vs macOS overlay vs web mimic) sebelum memilih stack.

## Risiko + Mitigasi

1. **Mencoba gambar pil iOS langsung** → gagal review / tidak mungkin via API publik. Mitigasi: pakai ActivityKit.
2. **Overlay dikira system UI** → permission ditolak user, dianggap malware. Mitigasi: minta permission per-fitur dengan penjelasan, default minimal.
3. **Polling event agresif (Now Playing, dll)** → CPU drain. Mitigasi: event-driven + throttle, tiru pola MediaRemote/event monitor yang efisien.
4. **Private API (`MediaRemote.framework`)** → bisa break tiap update macOS. Mitigasi: isolasi di adapter, fallback graceful.

## Assumptions & Limitations

- Asumsi pertanyaan "mac atau ios" berarti perbandingan mekanisme, bukan permintaan porting 1:1.
- Terbatas pada docs Apple per Sept 2026 (iOS 16.1+ hingga iOS 27 behavior landscape/StandBy) dan pola implementasi klon Mac open-source.
- Tidak memverifikasi kode repo lokal `C:\project\island-dynamic`.
- Tidak mengukur performa/animasi secara empiris.

## Next Steps

1. Tetapkan target platform `island-dynamic` (lihat Decision poin 3).
2. Jika overlay: definisikan state machine + priority scoring + pemicu expand.
3. Jika iOS: spike ActivityKit `request/update/end` + Widget Extension.

## Sources

- DynamicIsland — Apple Developer Documentation — https://developer.apple.com/documentation/widgetkit/dynamicisland
- ActivityKit — Apple Developer Documentation — https://developer.apple.com/documentation/activitykit
- Live Activities — Human Interface Guidelines — https://developer.apple.com/design/human-interface-guidelines/live-activities
- Live Activities essentials WWDC26 — https://developer.apple.com/videos/play/wwdc2026/223
- Displaying live data with Live Activities — https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities
- DynamicNotch README (pola overlay macOS SwiftUI+AppKit) — https://github.com/jackson-storm/DynamicNotch
- NotchDock README (NotchWindowController + NotchExpansionShape + MediaRemote) — https://github.com/SpencerMoxley/notchdock
- How It Works Dynamic Island for Mac (state model Dormant/Minimal/Compact/Expanded) — https://alcovenotch.com/how-it-works
