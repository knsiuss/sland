# Phase 6 — Performance + Security

> Scope: cross-cutting. Diterapkan di P1–P5, diverifikasi di phase ini. Tidak ada fitur baru.
> Sumber: sintesis risiko dari semua riset (belum ada research standalone — angka di bawah titik awal, tuning via ukur).

## 6.1 Performance budget (v1, diukur di laptop mid Win10/11)

- Idle (Dormant/Compact countdown): CPU <1%, RAM main+renderer <150MB, 0 wake berlebih.
- Burst 10 event/detik: tidak flicker (debounce 100–200ms), queue drain <1s setelah burst.
- Polling: media GSMTC 500–1000ms + event-driven; hardware (CPU/RAM/net) opsional + throttled, bukan default agresif.
- Render tick: Pomodoro sync 4Hz, media progress throttle ~1s, animasi morph via CSS spring/GPU (transform/opacity saja).
- I/O: tulis store hanya transisi/intent (P3 §, P5 §). Dilarang tulis tiap tick render.

## 6.2 Security baseline (Electron minimum)

- `contextIsolation:true, nodeIntegration:false`, `sandbox` on bila memungkinkan, `preload` minimal via `contextBridge` (whitelist channel `timer:intent, timer:sync, config:changed, media:command`).
- Validasi semua input lintas-trust-boundary: ajv untuk config/import (P5), sanitize `payload` event P2, sanitize angka timer P3, allowlist exe/URI di P4 (`shell.openExternal` hanya skema allowlist).
- Tanpa `require(userPath)`/dynamic ESM/VM plugin di v1. Tanpa fetch remote saat transisi kritis (suara/notif = aset lokal).
- Auto-update + signing dibahas sebelum distribusi (di luar v1 code, dicatat sebagai blocker rilis).
- Persist sensitif (token GitHub dsb, bila ada di P4 lanjutan): `safeStorage`, bukan plaintext config.

## 6.3 Definition of Done

- [ ] Ukur + catat: idle CPU/RAM, burst drain, cold start → island visible <2s.
- [ ] Audit checklist: `grep` tidak ada `nodeIntegration:true`, tidak ada `require(user`, tidak ada `openExternal` tanpa allowlist, tidak ada tulis-store di tick path.
- [ ] RDP/VM/GPU-lemah: fallback solid terbukti (tanpa blur), teks terbaca transparency 0.4–1.0.
- [ ] Corrupt-file + kill-mid-write: app tetap boot (backup+defaults), dibuktikan via test.

## 6.4 Non-goals

Optimasi premature (native Direct2D, Rust helper volume) sebelum budget di atas terbukti jebol via ukur.
