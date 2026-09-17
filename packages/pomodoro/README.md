# packages/pomodoro (P3)

`Domain/` = phase machine (focus/short/long + `cycleCount`); `Application/` = `TimerEngine` (`targetEndEpochMs`, `reconcile()`, idempotent history write); `Abstractions/` = store/clock ports (injectable `now` for tests).

Rules: deadline arithmetic only (`remaining = targetEnd - now`); persist on transitions + throttled tick; sleep/lock = elapsed by default; history append-only UTC ISO. DoD checklist: `docs/phase-3-pomodoro.md` §3.3.
