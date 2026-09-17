# ADR-002: Window technology (Electron frameless transparent overlay)

- **Tanggal:** 2026-09-17
- **Status:** Accepted

## Context

Butuh satu floating UI top-center yang terasa bagian dari Windows padahal app terpisah: collapse/expand fixed-size, selalu di atas window normal, tidak di taskbar, tajam di multi-monitor + DPI 125–250%. Alternatif: Tauri/WebView2 (ringan) atau native C++/Direct2D via Windhawk (paling ringan, bukan app standalone). Detail evidence: `research/2026-09-17-dynamic-island-windows.md`, `docs/window-overlay.md`.

## Decision

v1 = **Electron** `BrowserWindow({ frame:false, transparent:true, resizable:false, maximizable:false, fullscreenable:false, skipTaskbar:true, alwaysOnTop:true, level:'pop-up-menu' })`, dua ukuran fixed (collapsed/expanded), posisi dari `workArea` dalam DIP, pill dari CSS (solid/semi-solid, tanpa janji backdrop-blur real).

## Consequences

- Iterasi UI cepat (web tech) + wrapper GSMTC Node yang sudah terbukti (`windows-media-sessions`).
- Diterima sadar: bundle 100MB+, memori lebih besar dari Tauri/native.
- Diterima sadar: bisa tertutup fullscreen-exclusive game; tinggal di satu virtual desktop; rounding dari CSS bukan DWM.
- Evaluasi ulang (Tauri) hanya jika bundle-size/memory jadi blocker **terukur**, bukan asumsi.

## Alternatives considered

- **Tauri + WebView2:** ditolak untuk v1 — bundle kecil tapi ekosistem wrapper media lebih kecil + risiko inkonsistensi rendering; biaya Rust belum justified.
- **Native Windhawk mod (C++/Direct2D):** ditolak sebagai basis — bukan app standalone, iterasi lambat; dipakai sebagai referensi UX saja (hover-expand, auto-hide).
- **`level: 'screen-saver'`:** ditolak sebagai default — lebih tinggi dari taskbar tapi berisiko menutupi UI sistem tanpa uji fokus/aksesibilitas.
