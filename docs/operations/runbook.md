# Operational Runbook

> Format tiap entri: Symptom → Diagnosis → Logs to inspect → Known causes → Recovery → Rollback. Mulai dari yang paling sering, bukan abjad.

## RB-001: MAX Island not visible

1. **Check process** — apakah proses app jalan? (Task Manager → nama app). Tidak ada → start app; ada → lanjut.
2. **Check window state** — log scope `state`: surface terakhir (`dormant` saat idle = normal bila auto-hide on). Paksa tampil via tray → Show.
3. **Check monitor configuration** — `display-removed` di log? Posisi custom di luar `workArea`? Recovery: hapus/validasi ulang `position` (fallback `top-center` primary) — ERR-006.
4. **Reset UI configuration** — rename `config.json` → restart (app buat defaults + banner, file lama jadi `.bak`).
5. **Restart application** — quit via tray → start ulang → boot reconcile timer (NFR-REL-001).
6. **Collect diagnostics** — tray → Export diagnostics → lampirkan ke issue.

Known causes: auto-hide idle (bukan bug), monitor dicabut, fullscreen-exclusive menutup overlay (ekspektasi, default `hide`), config korup, crash renderer (main tetap jalan — cek tray).

## RB-002: Timer displays wrong time / phase completes instantly

- Logs: scope `timer` (`clockJumpSuspected`, `completedWhileSuspended`, `recoveredFromCrash`), `lastTick` gap.
- Known causes: system clock diubah manual/NTP jump (hormati wall-clock + flag — bukan bug, lihat ADR-001), sleep panjang (elapsed = by design), `timer.json` korup (fallback idle + `.bak`).
- Recovery: reset sesi; bila clock jump, biarkan reconcile + catat di history. Rollback: tidak perlu (state, bukan versi).

## RB-003: Media info missing / controls do nothing

- Logs: scope `provider` (`media`, error, at).
- Known causes: tidak ada sesi GSMTC (app media tidak mendaftar / tertutup), SMTC-only (failure mode — pastikan provider GSMTC), modul `music=false` (event di-drop by design).
- Recovery: buka Spotify/YouTube → play → cek island; restart provider (respawn backoff otomatis). Rollback: tidak perlu.

## RB-004: Settings reset to defaults on every start

- Logs: scope `config` (fallback, migrasi, import ditolak).
- Known causes: `config.json` korup / ditulis tool lain / versi masa depan.
- Recovery: restore dari `config.bak-<ts>.json` terbaru yang valid → restart. Rollback: pakai backup profil (lihat release-engineering).

## RB-005: Production build broken after update (rollback)

- Diagnosis: bandingkan versi di log boot + changelog; reproduksi di versi sebelumnya?
- Recovery: uninstall versi rusak → instal installer versi terakhir hijau → config lama tetap kompatibel (migrasi maju saja; downgrade pakai `.bak` bila schema berubah — lihat release-engineering).
- Kumpulkan diagnostics sebelum rollback agar penyebab tidak hilang.
