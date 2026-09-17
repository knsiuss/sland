# Phase 2 — State/Event Architecture

> Scope: SATU State Manager event-driven. UI hanya render `IslandSurfaceState`.
> Sumber: `research/2026-09-17-dynamic-island-state-system.md` + `research/2026-09-17-dynamic-island-ios-macos-mekanisme.md`.

## 2.1 Keputusan kunci

- Alur: Sources (hanya emit) → Bus (normalize+validate+dedupe) → Priority Queue → Reducer murni → Shell (render saja).
- Tidak ada `if pomodoro/show music` di UI. Tambah sumber = tambah actor + kategori, tanpa sentuh renderer.
- Surface: `dormant / compact / peek / expanded` (+ `pinned/dismissed` di v2).
- Priority awal: critical 100 (pinned) > urgent 80 > transient 60 (default 4000ms) > media-event 40 (3000–5000ms, secondary bubble saat Pomodoro aktif) > persistent 20 (sticky, no timeout) > idle 0.
- Preempt hanya jika `incoming.priority > current.priority`. Sama/rendah → queue FIFO (`priority desc, timestamp asc`, cap 20, overflow collapse `+N`).
- Timeout milik manager: `Timeout Registry` berbasis `endTime = now + ms`, `cancel on exit/click→expanded`, hover/focus pause (simpan remaining). Persist deadline+queue+history.
- History stack (max ~5) + validasi sebelum restore → fallback queue head → dormant.
- Tick (`POMODORO.TICK`/`MEDIA.PROGRESS`, throttle ~1s) hanya update payload, tidak ganti surface.
- `core/events` MURNI: tanpa import electron/react. `(state, event, now) → state`, waktu di-inject, tanpa `Math.random`/`Date.now()` di reducer.

## 2.2 Kontrak event (stabil, perubahan = update doc ini)

```ts
type IslandEventType =
  | "POMODORO.TICK" | "POMODORO.STARTED" | "POMODORO.PAUSED" | "POMODORO.FINISHED"
  | "MEDIA.TRACK_CHANGED" | "MEDIA.PLAY_PAUSE" | "MEDIA.STOPPED"
  | "NOTIFY.RECEIVED" | "NOTIFY.DISMISSED"
  | "MIC.STATE_CHANGED" // NEW (requirements §8): heuristik {active, confidence}, bukan janji pasti
  | "USER.HOVER" | "USER.LEAVE" | "USER.CLICK" | "USER.DISMISS"
  | "SYSTEM.TIMEOUT" | "SYSTEM.QUEUE_DRAINED";
```

Field wajib: `id, type, category, priority, timeoutMs|null, timestamp (bus-inject), payload, sticky`.

## 2.3 Alur referensi (Pomodoro → GitHub 4s → kembali)

`POMODORO.STARTED (20, sticky)` → `Compact(Pomodoro)` → `NOTIFY.RECEIVED (60, 4000)` preempt + save history → `Peek(GitHub)` → `SYSTEM.TIMEOUT` → pop history → `Compact(Pomodoro sisa waktu, bukan restart)`.

## 2.4 Definition of Done

- [ ] Unit test murni hijau: (a) Pomodoro→GitHub 4s→kembali sisa waktu, (b) burst track-change tidak rebut Pomodoro, (c) click saat peek→expanded+cancel timeout, (d) history basi→fallback dormant, (e) dedupe+overflow collapse.
- [ ] `core/events` 0 dependency Electron/React (diuji via lint/import-check).
- [ ] Debounce render 100–200ms, tidak flicker saat burst.

## 2.5 Non-goals

Langsung depend `xstate` di v1 (cadangan saat domain >5). `pinned/minimal-detached`/multi-bubble penuh di v2.
