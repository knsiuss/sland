# ADR-004: Storage (plain JSON in userData, no store dependency)

- **Tanggal:** 2026-09-17
- **Status:** Proposed

## Context

Perlu persistensi kecil: settings, state Pomodoro (untuk restore pasca-restart, lihat ADR-001), preferensi (durasi, toggle fullscreen-hide, startup). Alternatif: `electron-store` (nyaman) atau SQLite (query power). Volume data: <100KB, tulis jarang (debounced), baca saat start.

## Decision

File JSON polos di `app.getPath('userData')/settings.json`, tulis atomik (tmp + rename), tulis di-debounce ±300ms, sertakan field `schemaVersion: 1` untuk migrasi. Tanpa dependency store tambahan.

## Consequences

- Nol dependency baru (sesuai prinsip minimal dependencies).
- Korupsi parsial hampir mustahil (rename atomik); file korup total = fallback default + tulis ulang saat perubahan berikutnya (jangan crash).
- Batasan sadar: tanpa enkripsi (jangan simpan token/secret di sini — itu butuh `safeStorage`/keychain, keputusan terpisah), tanpa query kompleks. Bila butuh histori/clipboard-log/query → ADR baru (SQLite), bukan dipaksa ke JSON.

## Alternatives considered

- **electron-store:** ditolak untuk v1 — kenyamanan kecil, dependency + surface update tambahan untuk kebutuhan yang setara JSON 30 baris.
- **SQLite:** ditolak untuk v1 — overkill untuk key-value <100KB; dibuka lagi bila ada kebutuhan query/histori.
- **localStorage renderer:** ditolak — milik renderer (hilang saat cache di-clear, tidak bisa diakses main untuk notify/restore headless).
