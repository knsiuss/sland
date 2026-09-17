# 09 Privacy Requirements

- PVR-001 (v1): Setiap capability sensitif (notifikasi, lokasi, mic) butuh opt-in eksplisit per kategori.
- PVR-002 (v1): Sinyal mic hanya heuristik — UI wajib label confidence
  (mis. "kemungkinan mic aktif"), tidak pernah assert `MIC ACTIVE` pasti.
- PVR-003 (v1): Isi notifikasi tidak keluar mesin secara default (local-first).
- PVR-004 (v1): Tanpa telemetri/analytics default; bila ada, opt-in + bisa dimatikan total.
- PVR-005 (v1): Fitur AI mengikuti tier izin ADR-006 (off/observe/suggest/act); cloud opt-in.
- PVR-006 (v1): Izin dicabut → degradasi diam-diam ke tier lebih rendah + indikator jujur,
  bukan error/crash.
