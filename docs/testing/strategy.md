# Testing Strategy

> Kanonis untuk level + matriks manual: `docs/requirements/12-testing.md`, `13-traceability.md`. Dokumen ini = strategi (kenapa tiap level ada, kapan jalan, kriteria lolos), bukan daftar TC.

## Prinsip

`Every requirement should be testable.` Rantai selalu: `Requirement → Design → Implementation → Test`. TC gagal = requirement belum selesai, sekecil apa pun diff-nya.

Contoh rantai (format user — alias ID lama dicantumkan agar tidak putus):

```
FR-POM-001 (= FR-010 Start Timer)
      ↓ design: Timer Engine, ADR-001 target-timestamp
POM-001 (`src/main/pomodoro.js` → start())
      ↓
Unit Test (node:test, tanpa Electron): start → RUNNING + endAt di masa depan
      ↓
Integration Test (Electron): intent start via IPC → sync 4Hz → countdown tampil di island
```

## Level tes

| Level | Apa | Di mana jalan | Kapan wajib hijau |
|---|---|---|---|
| Unit | Resolver prioritas, hitung timer (ADR-001), store atomic + corrupt fallback, normalisasi adapter, `sanitizeConfig` | `node:test`, tanpa Electron | Setiap PR |
| Integration | IPC main↔renderer, GSMTC snapshot → judul tampil, media-key → status berubah, config:changed → CSS vars teraplikasi | Electron headless-sebisa-mungkin | Setiap PR (yang butuh display = boleh manual tercatat) |
| Component | Island Shell render per `IslandSurfaceState` (dormant/compact/peek/expanded), Settings form + preview | Renderer harness | Saat ubah UI |
| End-to-End | Alur penuh user: start focus → notif GitHub 4 dtk → kembali sisa waktu; kill → relaunch recovery | Manual tercatat v1 (otomasi E2E formal ditunda sampai P6) | Pre-release |
| Performance | PERF-001: CPU idle 60 dtk; startup; animasi tanpa jank | Mesin target, Task Manager + `getCPUUsage`/`getProcessMemoryInfo` | P6 + tiap release |
| Security | TC-SEC-001: `contextIsolation` on, `nodeIntegration` off, tanpa `require` dinamis, `openExternal` allowlist, grep secret | CI grep + audit manual | Setiap PR + pre-release |
| Regression | Seluruh TC v1 di `12-testing.md` + matriks manual overlay | CI + checklist | Tiap release, dan tiap kali kontrak antar-phase berubah |

## Kebijakan regresi

- Perubahan kontrak antar-phase (event/config/window API) WAJIB menjalankan ulang seluruh TC yang terhubung di `13-traceability.md`, bukan hanya TC milik phase itu.
- Baris `deferred` tidak punya TC v1 — sengaja. Saat deferred diaktifkan, TC ditulis dulu (test-first), baru implementasi.
- Flaky test tidak di-skip diam-diam: karantina dengan issue + batas waktu, atau hapus dan ganti TC deterministik.
