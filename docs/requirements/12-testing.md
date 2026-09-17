# 12 Testing Requirements

## Prinsip pemetaan

Setiap requirement akhirnya bisa dites. Alurnya selalu:

```
Requirement → Design → Implementation → Test Case
```

Contoh:

```
FR-010 Start Pomodoro
        ↓
TC-010: Given timer idle, When user clicks Start, Then timer enters RUNNING
```

## Level tes

1. **Unit (`node:test`, tanpa Electron):** resolver prioritas, hitung timer (ADR-001),
   store (atomic write + corrupt fallback), normalisasi adapter.
2. **Integrasi (Electron, headless-sebisa-mungkin):** IPC main↔renderer, GSMTC snapshot →
   tampil judul, media-key → status berubah.
3. **Manual (matriks):** DPI, multi-monitor, taskbar, fullscreen-exclusive vs borderless,
   RDP/VM — lihat `../window-overlay.md`.

## Test case v1 (wajib)

- TC-010: Given timer idle, When Start diklik, Then timer RUNNING + `endAt` di masa depan.
- TC-011: Given RUNNING, When Pause, Then sisa waktu beku; When Resume, Then lanjut dari sisa.
- TC-012: Given RUNNING melewati sleep/wake simulasi, Then sisa = `endAt - now` (tanpa drift).
- TC-020: Given sesi GSMTC playing, When snapshot masuk, Then judul tampil di slot media.
- TC-021: When tombol toggle ditekan, Then status sesi berubah (play↔pause).
- TC-030: Given EXPANDED idle 5 dtk tanpa interaksi, Then kembali COMPACT.
- TC-031: Given POMODORO jalan + notifikasi masuk, Then 4 dtk kemudian content = POMODORO.
- TC-040: Given settings korup, When app start, Then default + banner, tanpa crash (ERR-003).
- TC-050: When tema Windows terang, Then island terang; When gelap, Then gelap (FR-050).
- TC-SEC-001: Audit — `contextIsolation` on, `nodeIntegration` off, tanpa `require` dinamis (SEC-001/003).
- PERF-001: Ukur CPU idle 60 dtk <1% + memori tercatat (NFR-PERF-001).

## Aturan

- Setiap FR/SEC/ERR status `v1` punya ≥1 TC di matriks (`13-traceability.md`).
- TC gagal = requirement belum selesai, sekecil apa pun diff-nya.
