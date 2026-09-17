# Observability

> Menjawab: "Kalau user bilang app gue tiba-tiba gak muncul, apa yang terjadi?" Jawaban proseduralnya di `runbook.md`. Dokumen ini = apa yang dicatat dan diukur agar pertanyaan itu bisa dijawab.

## Logs

- Format terstruktur `{ts, level, scope, event, data}` (JSONL lokal, bukan plaintext bebas).
- Scope wajib: `timer` (`clockJumpSuspected`, `completedWhileSuspended`, `recoveredFromCrash`), `state` (preemption/restore/timeout cancel), `config` (fallback defaults, migrasi, import ditolak), `provider` (`{provider, error, at}` — ERR-007).
- Ring buffer di disk (batas ukuran, mis. 5 MB rotate) agar tidak membanjiri disk.
- Level default `info`; `debug` hanya via flag sementara + otomatis kembali.

## Metrics (lokal, on-demand — bukan telemetri jaringan)

| Metric | Definisi | Sumber | Ambang |
|---|---|---|---|
| `startup_time` | `app.ready` → `ready-to-show` + `showInactive` | Log main | X dtk (NFR-PERF-003, TBD benchmark) |
| `idle_cpu` | CPU collapsed statis 60 dtk | `process.getCPUUsage()` + Task Manager | X% (NFR-PERF-001, target negligible) |
| `memory_usage` | Working set saat idle | `process.getProcessMemoryInfo()` | X MB (NFR-MEM-001, MAX 500) |
| `animation_frame_rate` | FPS expand/collapse morph | Observasi + devtools frame meter | 60 FPS (NFR-PERF-002) |
| `timer_drift` | Selisih deadline vs wall-clock per sesi 25 mnt | `endAt - Date.now()` saat complete | <1 dtk (NFR-REL-001) |
| `crash_count` | Crash main/renderer per versi | Log boot `recoveredFromCrash` + OS event | 0 diketahui saat release |
| `integration_failure_count` | Gagal GSMTC/listener/foreground per hari | Log provider + ERR-007 | Tren turun; spike = investigasi |

## Diagnostics

- Aksi "Export diagnostics" (dari tray): bundel log ring buffer + config aktif (secret diredaksi) + versi app/OS + status provider + metrik terakhir → satu file untuk dilampirkan ke laporan bug.
- Tidak ada upload otomatis. User mengirim manual.

## Crash reports

- Main `uncaughtException`: `persistSync()` best-effort + tulis marker crash + dialog aman (tanpa loop restart).
- Renderer crash: main tetap jalan + notif OS tetap muncul (ADR-007); relaunch re-sync via boot reconcile.
- Tidak ada crash reporter jaringan di v1.

## Performance measurements

- Prosedur baku PERF-001 (diulang tiap release + saat klaim regresi): tutup app lain yang berat → collapsed statis 60 dtk → catat `idle_cpu` + `memory_usage` → expand/collapse 5x → catat `animation_frame_rate` → tulis ke changelog release.

## Privacy

- Prinsip: telemetry yang tidak diperlukan tidak dikumpulkan. Tidak ada telemetri jaringan, analytics, atau tracking di v1.
- Secret/token tidak pernah masuk log, diagnostics, `.bak`, atau crash report (redaksi otomatis + grep audit TC-SEC-001).
