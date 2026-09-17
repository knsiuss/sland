# 10 Error Handling Requirements

Prinsip: **satu module mati, MAX Island jangan ikut mati.**

- ERR-001 (v1): Jika integrasi media gagal (backend hilang, tidak ada sesi),
  island tetap jalan; slot media tampil idle.
- ERR-002 (v1): Jika integrasi notifikasi gagal, Pomodoro tetap berjalan normal.
- ERR-003 (v1): Jika settings tidak bisa dibaca, fallback ke default + banner sekali,
  tidak pernah crash saat start.
- ERR-004 (v1): Integrasi eksternal yang gagal tidak boleh crash main process
  (isolasi try/catch per provider + backend di-respawn dengan backoff).
- ERR-005 (v1): Izin OS ditolak/dicabut di tengah jalan → fitur terkait nonaktif
  dengan indikator jujur, sisanya normal.
- ERR-006 (v1): Display berubah (cabut monitor, ganti DPI) saat expand →
  re-layout ke display target, tidak nyangkut di luar layar.
- ERR-007 (v1): Setiap error provider log `{provider, error, at}`; log dibatasi
  (ring buffer) agar tidak membanjiri disk.
