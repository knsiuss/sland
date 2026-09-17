# platform/windows/media (P4)

GSMTC provider (`RequestAsync → GetCurrentSession/GetSessions → Try*`, events `MediaPropertiesChanged/PlaybackInfoChanged/CurrentSessionChanged`). Serves Spotify, Chromium/Edge (YouTube), and every GSMTC-registered app through ONE provider — no per-app adapters.

Spike gate (before build): play/pause/next on Spotify + YouTube from the island. Polling ≤1Hz + event-driven; never SMTC-only.
