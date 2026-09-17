# Phase 3 — Pomodoro Engine

> Scope: deadline-based wall-clock timer. `setInterval` hanya untuk render.
> Sumber: `research/2026-09-17-pomodoro-timer-engine.md`. Konsumen: emit event ke P2, bukan render langsung.

## 3.1 Keputusan kunci

- Source of truth: `targetEndEpochMs = Date.now() + durationMs`, `remainingMs = targetEnd - Date.now()`. Tick render 250–500ms, display `Math.ceil(remaining/1000)`.
- Engine di main process. Renderer hanya kirim intent (`timer:intent`) + terima `timer:sync` (4Hz) + `timer:phaseComplete`.
- Persist aktif (`phase, targetEndEpochMs, remainingMsOnPause, cycleCount, configSnapshot, lastTickEpochMs`) tiap transisi + `hidden/blur/suspend/lock` (best-effort sync <10ms) + tick jarang tiap 5s. Jangan tulis tiap 250ms. Tulis atomik.
- Pause = bekukan deadline (`remainingOnPause`, `targetEnd=null`). Resume = `targetEnd = now + sisa`. Ganti config saat running berlaku sesi berikutnya (atau tombol eksplisit restart).
- Sleep/lock/suspend = elapsed default. Jangan andalkan handler `suspend` sempat jalan (Win11 24H2 laptop). Rekonsiliasi di `resume/unlock/visible/focus/tick`. `pauseOnLock` = kebijakan di unlock (`targetEnd += unlockNow - lockStart`), bukan di lock.
- Timezone irrelevant (epoch-ms + ISO UTC history). Clock-jump: bandingkan wall vs monotonic, threshold >30s atau >10% durasi → flag `clockJumpSuspected`, tetap hormati wall-clock.
- History append-only terpisah (`SessionRecord`, idempotent `phaseRunId`), statistik dari history bukan `cycleCount`.
- State machine: `focus → (cycle%sessions==0 ? longBreak : shortBreak) → focus`, `cycleCount=0` setelah long. Auto-start default OFF v1 (atau countdown-delay 10s + Batal).
- Notif+suara dipicu deadline check. Primer = OS toast (`new Notification`), suara = aset lokal preload setelah gesture. Sesi selesai saat terkunci = toast persisten + suara saat unlock.

## 3.2 Kontrak ke P2

Emit `POMODORO.STARTED (20, sticky, no timeout) / TICK (payload remaining, no surface change) / FINISHED (80, expanded 5s)`. Config via P5, tidak baca store langsung selain snapshot sendiri.

## 3.3 Definition of Done

- [ ] Checklist verifikasi riset § Checklist (freeze 5–10s, minimize 10 mnt, sleep 2 mnt, kill saat running/paused, clock-jump, timezone, config korup, suara+toast minimized tanpa dobel) lolos.
- [ ] `backgroundThrottling:false` diset, tapi kebenaran tetap dari deadline (buktikan via freeze test).
- [ ] Crash recovery: running-lewat-deadline → complete tertunda + banner; paused → kembali paused sama.

## 3.4 Non-goals

Strict-mode blocking situs, analytics cloud, sync multi-device, SQLite history v2.
