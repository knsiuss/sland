# platform/windows/system (P4)

Foreground (`GetForegroundWindow` + exe allowlist → `AppPresence`) + URI launcher; battery (`AggregateBattery`/`PowerManager`, `GetSystemPowerStatus` fallback); network (`NetworkInformation` online/offline, no special permission); Downloads folder watcher (no OS download manager — browser downloads without extension are out of scope); clipboard current item only (Win+V history unreadable — no public API); `powerMonitor` suspend/resume/lock wiring (best-effort persist, reconcile on wake).

Deferred here (heuristics or later phases, never promised in v1): exact mic state, Wi-Fi BSSID, external brightness, calendar sync, forced Focus sessions.
