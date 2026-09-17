# ADR-006: AI permission model (tiers + local-first)

- **Tanggal:** 2026-09-17
- **Status:** Proposed

## Context

Rencana lanjutan MAX Island mencakup fitur AI (ringkasan notifikasi, saran fokus, aksi otomatis). Tanpa model izin sejak awal, pola default menjadi "AI boleh segalanya" — risiko privasi (konten layar/mic/notifikasi bocor ke cloud) + aksi merusak tanpa consent (tutup app, ubah setting). Keputusan ini dipasang **sebelum** ada kode AI, agar semua fitur AI lahir dengan izin yang benar.

## Decision

Empat tier izin, **local-first** (default: tidak ada data keluar mesin):

| Tier | Bisa apa | Syarat |
|------|----------|--------|
| 0 `off` | AI mati total | default untuk kategori sensitif (mic, isi layar) |
| 1 `observe` | Baca state lokal ternormalisasi saja (lihat ADR-003) | Opt-in per kategori |
| 2 `suggest` | Menyarankan aksi sebagai draft di UI | User tekan tombol untuk eksekusi |
| 3 `act` | Eksekusi langsung | Grant eksplisit per-aksi + allowlist; aksi destruktif selalu butuh konfirmasi |

Aturan keras:

1. **Jaringan default mati** — inferensi lokal dulu; cloud hanya bila user mengaktifkan + tahu data apa yang keluar.
2. **Tidak ada tier `act` untuk:** menutup/membunuh proses, mengubah setting sistem, mengirim data keluar, menghapus file.
3. **Audit log** — setiap aksi tier 3 tercatat (apa, kapan, atas izin apa), bisa dilihat user.
4. Izin mengikuti model consent OS (lihat notification listener / location consent di riset integrasi): bila user mencabut di tengah, fitur degradasi diam-diam menjadi tier lebih rendah + indikator jujur di UI, bukan error/crash.

## Consequences

- Setiap proposal fitur AI wajib menyatakan tier-nya — review menjadi mekanis, bukan debat selera.
- Biaya: perlu permission store + UI grant/indicator sebelum fitur AI pertama bisa jalan (pekerjaan upfront kecil untuk keamanan besar).
- Batasan sadar: model ini mengatur **izin**, bukan kualitas model/AI provider — itu ADR terpisah saat provider dipilih.

## Alternatives considered

- **All-or-nothing (satu toggle AI on/off):** ditolak — user dipaksa memilih antara "AI buta" atau "AI boleh segalanya".
- **Implicit consent (pakai = setuju):** ditolak — melanggar prinsip consent eksplisit OS dan menghancurkan kepercayaan untuk overlay yang selalu tampil.
- **Cloud-first:** ditolak — latency + privasi; dibalik menjadi local-first dengan cloud sebagai opt-in.
