# 05 System Integration Requirements

## v1 (wajib / bersyarat)

- SIR-001 (v1): Baca semua sesi media via GSMTC (`GetCurrentSession/GetSessions` + event).
- SIR-002 (v1): Kontrol media via tombol media level OS (berlaku ke sesi aktif sistem).
- SIR-003 (v1): Deteksi app foreground via `GetForegroundWindow` + allowlist exe, polling ≤1Hz.
- SIR-004 (v1): Status baterai via `AggregateBattery`/PowerManager (fallback `GetSystemPowerStatus`).
- SIR-005 (v1): Status online/offline via `NetworkInformation` (tanpa izin khusus).
- SIR-006 (v1-conditional): Mirror notifikasi via `UserNotificationListener` — hanya bila user memberi izin;
  bila ditolak/dicabut, degradasi diam-diam + indikator jujur.
- SIR-007 (v1): Clipboard item saat ini via Electron `clipboard` (tanpa klaim histori Win+V).

## Deferred (dilarang di v1)

- SIR-D01: Status mic pasti (hanya heuristik ber-confidence, lihat PVR-002).
- SIR-D02: Scan Wi-Fi / BSSID (butuh location consent).
- SIR-D03: Calendar sync (butuh OAuth/Graph).
- SIR-D04: Brightness monitor eksternal (DDC/CI sering no-op).
- SIR-D05: Discord voice-state (tidak ada API lokal publik).
- SIR-D06: GitHub live (cukup deep-link + REST bila ada token).
- SIR-D07: Download browser (hanya FS-watcher folder Downloads).

Rujukan evidence: `research/2026-09-17-max-island-system-application-integration.md`.
