# 03 Non-Functional Requirements

## Performance

- NFR-PERF-001 (v1): CPU idle <1% rata-rata 60 dtk di mesin referensi (lihat PERF-001).
- NFR-PERF-002 (v1): Cold start → pill interaktif <3 dtk.
- NFR-PERF-003 (v1): Snapshot media tidak membanjiri IPC (thumbnail hanya saat track berubah).

## Reliability

- NFR-REL-001 (v1): Satu provider mati tidak mematikan island (lihat ERR-001–ERR-004).
- NFR-REL-002 (v1): Timer tetap akurat melewati sleep/wake (lihat ADR-001).

## Usability

- NFR-USE-001 (v1): Status terbaca sekilas <1 dtk tanpa expand.
- NFR-USE-002 (v1): Semua aksi utama bisa keyboard (Enter/Space/Esc).

## Maintainability

- NFR-MNT-001 (v1): Modul murni (resolver, hitung timer, store) ter-cover `node:test`.
- NFR-MNT-002 (v1): Satu file = satu tanggung jawab; fungsi ≤50 baris.
