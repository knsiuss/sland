# ADR-001: Use target timestamp instead of interval counting

- **Tanggal:** 2026-09-17
- **Status:** Accepted

## Context

Pomodoro butuh countdown akurat (25/5/15 menit) di overlay yang sering unfocused. `setInterval` di-throttle browser/Chromium saat window tidak fokus, dan laptop bisa sleep/hibernate di tengah sesi. Menghitung mundur dengan mengurangi counter tiap tick mengakumulasi drift dan salah total setelah sleep/wake.

## Decision

Simpan `endAt = Date.now() + remainingMs` saat timer jalan; setiap tick hitung `sisa = endAt - Date.now()`. Pause = bekukan `remainingMs`. Persist `{ mode, remainingMs, endAt, running }` agar survive restart.

## Consequences

- Tahan terhadap throttling, suspension, dan sleep/wake (self-correcting).
- Persistensi trivial: cukup simpan angka, bukan objek timer.
- Restore yang "basi" (endAt sudah lewat saat dibuka) diperlakukan sebagai sesi selesai, bukan waktu negatif — perlu aturan eksplisit ini di kode.
- Tidak cocok untuk kebutuhan sub-detik presisi (bukan kebutuhan Pomodoro).

## Alternatives considered

- **Decrement counter per tick:** ditolak — drift saat throttle/sleep.
- **`performance.now` delta accumulation:** ditolak — tidak survive restart (epoch berbeda) dan tetap butuh mapping ke wall-clock untuk persist.
- **OS Focus Sessions API sebagai sumber waktu:** ditolak — `TryStartFocusSession` adalah Limited Access Feature (butuh unlock token); deteksi boleh, ketergantungan jangan.
