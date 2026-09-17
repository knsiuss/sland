# packages/media (P4)

Normalizes any player into `MediaState` (title/artist/artwork/timeline/status) and translates island intents into transport commands. Media *events* are transient (3–5s popup); only explicit persistent playback may hold the collapsed slot — and never over an active Pomodoro (secondary bubble/queue instead, cf. Windhawk #4738).

Forbidden: SMTC-only control of other apps (must be GSMTC `GetCurrentSession/GetSessions/Try*`).
