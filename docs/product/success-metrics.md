# Success Metrics

> Diukur lokal/manual di v1 (tanpa telemetri — lihat `operations/observability.md`). Tiap rilis mencatat 7 metrik di observability + changelog.

## Ambang v1.0.0

| Metrik | Ambang | Sumber |
|---|---|---|
| `startup_time` | < X dtk (diisi benchmark) | Log boot |
| `idle_cpu` | < X% / negligible 60 dtk | PERF-001 |
| `memory_usage` | < X MB (MAX 500) | PERF-001 |
| `animation_frame_rate` | 60 FPS, tanpa jank | Observasi 5x morph |
| `timer_drift` | <1 dtk per 25 mnt | Log `timer` |
| `crash_count` | 0 diketahui | Log boot + RB-005 |
| `integration_failure_count` | Tren turun per rilis | Log provider |

## Kualitatif (post-release review)

- "Tidak menghalangi kerja" — nol laporan focus-steal yang valid (NFR-UX-002).
- "Dipercaya timernya" — nol laporan drift yang valid (NFR-REL-001).
- "Mudah pulih" — setiap laporan "gak muncul" selesai via runbook tanpa hapus data (RB-001).
