# ADR-003: State management (centralized store + priority resolver)

- **Tanggal:** 2026-09-17
- **Status:** Proposed

## Context

Banyak sumber event (Pomodoro tick, GSMTC session-change, notifikasi, system state, klik user) berebut satu slot UI. State tersebar di tiap widget = race condition visual: island flicker, transient nyangkut, timer tertimpa. Kontrak perilaku: `docs/state-machine.md`.

## Decision

Satu **pemilik state terpusat** (single store, event-normalized: `MediaState / SystemState / AppPresence`) + **priority resolver** sebagai satu-satunya yang boleh memutuskan content + visibility. Widget hanya render (tanpa logika rebut-slot sendiri). Tick media (posisi timeline) bukan event resolver — hanya update progress bar. Setiap transisi log `{from, to, reason, at}` (ring buffer 50).

## Consequences

- Perilaku deterministik dan bisa di-test tanpa Electron (resolver = fungsi murni: `activeSources → content`).
- Urutan migrasi jelas: resolver murni dulu (bisa unit-test hari ini), store terpusat saat codebase tumbuh.
- Biaya: event harus dinormalisasi ke bentuk `MediaState/SystemState/AppPresence` sebelum masuk — adapter dilarang mendorong format mentah ke UI.

## Alternatives considered

- **State per-widget (lokal):** ditolak — tidak ada wasit saat event bersamaan; bug flicker tidak reproducible.
- **Antrean FIFO semua event:** ditolak — transient menumpuk jadi antrean panjang; island berubah jadi notification center.
- **Pub/sub bebas tanpa resolver:** ditolak — subscriber race, urutan tampil tergantung urutan subscribe.
