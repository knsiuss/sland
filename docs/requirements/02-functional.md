# 02 Functional Requirements

## Island shell

- FR-001 (v1): Island render sebagai pill collapsed saat ada sumber aktif, dormant saat tidak ada.
- FR-002 (v1): Klik pill → expand; tombol/dismiss → collapse.
- FR-003 (v1): Auto-collapse setelah 5 dtk idle, kecuali user-pin / timer jalan / media playing.

## Pomodoro

- FR-010 (v1): Start Pomodoro dari idle → timer RUNNING (lihat TC-010).
- FR-011 (v1): Pause membekukan sisa waktu; resume lanjut dari sisa (lihat TC-011).
- FR-012 (v1): Reset kembali ke idle + durasi penuh mode saat itu.
- FR-013 (v1): Skip menyelesaikan sesi aktif dan pindah ke sesi berikut.
- FR-014 (v1): Durasi 25 fokus / 5 istirahat pendek / 15 istirahat panjang; long-break tiap 4 fokus selesai.
- FR-015 (v1): Notifikasi Windows saat sesi selesai + bunyi pendek (WebAudio, tanpa file).
- FR-016 (v1): Timer tampil di slot collapsed saat berjalan.

## Media

- FR-020 (v1): Tampilkan judul (+ artis bila ada) sesi GSMTC aktif.
- FR-021 (v1): Tombol play/pause/next/previous mengendalikan sesi aktif sistem.
- FR-022 (v1): Progress bar posisi/durasi, diinterpolasi lokal antar snapshot.
- FR-023 (v1-conditional): Artwork bila tersedia; placeholder bila tidak.

## Sistem & tray

- FR-030 (v1): Jam + tanggal di pill dan panel Sistem.
- FR-031 (v1): Tray: show/hide island, expand/collapse, quit.
- FR-032 (v1): Toggle startup Windows (via `setLoginItemSettings`).
- FR-033 (v1-conditional): Notifikasi app lain tampil transient 4 dtk bila izin listener diberikan.
- FR-040 (v1): Label app foreground untuk exe allowlist (Code, chrome, msedge, discord, explorer).

## Tampilan

- FR-050 (v1): Theme gelap default + terang mengikuti tema Windows (lihat TC-050).
