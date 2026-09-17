# API Contracts

> Kontrak lintas-boundary. Detail perilaku di doc masing-masing; yang mengikat di sini hanya bentuk + arah + frekuensi. Perubahan = update doc ini + phase terkait + TC terkait (aturan kontrak AGENTS.md).

## IPC (renderer ↔ main, via preload `contextBridge` minimal)

| Channel | Arah | Payload | Frekuensi |
|---|---|---|---|
| `timer:intent` | R→M | `{action: start\|pause\|resume\|skip\|reset, phase?, durationMs?}` | on user action |
| `timer:sync` | M→R | `{remainingMs, phase, status, cycleCount}` | 4 Hz saat running + segera saat transisi |
| `timer:phaseComplete` | M→R | `{phase, outcome, flags}` | on deadline |
| `island:intent` | R→M | `USER.HOVER/LEAVE/CLICK/DISMISS` | on interaction |
| `island:sync` | M→R | `{surface, animationIntent}` | on decision change (debounce 100–200 ms saat burst) |
| `config:set` / `config:get` | R↔M | partial config tervalidasi | on settings change (debounce slider) |
| `config:changed` | M→R | full active config | on store write / migrasi |
| `set-ignore-mouse-events` | R→M | `{ignore, forward}` | on hit-region change (bukan timer) |

Larangan: `nodeIntegration:true`, expose `require`/fs mentah, handler IPC generik.

## Event (provider → State Manager)

`IslandEvent {id, type, category: pomodoro|media|notification|system|user, priority: 0/20/40/60/80/100, timeoutMs: number|null, timestamp (bus-inject), payload, sticky}`. Aturan: `>` preempt + save history, `==` FIFO, `<` queue sort `(priority desc, ts asc)`; tick hanya update payload. Kanonis: `../requirements/06-state-event.md` + riset state-system.

## Config (settings ↔ store)

Schema berversi `configVersion`, enum/pattern/clamp, `additionalProperties:false`; satu jalur tulis tervalidasi; backup `.bak` sebelum overwrite/migrasi. Kanonis: riset customization-system + `sanitizeConfig`/`migrateConfig` di `src/shared`.
