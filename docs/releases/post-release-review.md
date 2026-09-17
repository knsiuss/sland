# Post-Release Review

> Dilakukan setelah tiap MVP/minor. Aturan terpenting: **jangan mempertahankan architecture hanya karena kita yang membuatnya. Kalau evidence menunjukkan desain salah, redesign** (via ADR baru `Superseded-by`, bukan edit diam-diam).

## Agenda baku (jawab dengan evidence, bukan opini)

1. What worked?
2. What failed?
3. What surprised us?
4. What metrics changed? (`startup_time`, `idle_cpu`, `memory_usage`, `animation_frame_rate`, `timer_drift`, `crash_count`, `integration_failure_count` — bandingkan dengan rilis sebelumnya.)
5. Which assumptions were wrong? (Tandai asumsi di riset yang gugur + perbarui doc sumbernya.)
6. What should we redesign? (Keputusan → ADR baru; requirement → update ID + TC; rilis → masuk roadmap.)

## Output wajib

- Catatan 1 halaman di bawah (tambah seksi per rilis) + tindak lanjut ber-ID (masuk roadmap atau dihapus eksplisit dengan alasan).
- Metrik per rilis dicatat di `../operations/observability.md` prosedur + changelog bila memengaruhi janji performa.

## Log review

_Inti per rilis ditulis di sini setelah review dilakukan._
