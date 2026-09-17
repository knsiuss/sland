# 07 Data Requirements

- DAR-001 (v1): Settings di `userData/settings.json` dengan field `schemaVersion: 1`.
- DAR-002 (v1): State Pomodoro tersimpan: `{ mode, durationMs, remainingMs, endAt, running, completed }`.
- DAR-003 (v1): Tulis atomik (tmp + rename), di-debounce ±300ms.
- DAR-004 (v1): Store korup/tidak bisa dibaca → default + banner (lihat ERR-003).
- DAR-005 (v1): Dilarang menyimpan secret/token di settings (butuh `safeStorage` = ADR terpisah).
- DAR-006 (v1): Kumpulkan semua error validasi schema sekaligus (bukan fail-fast satu field).

Rujukan: ADR-004.
