# Execution Plan — MAX Island (Layered, L0–L13)

> Status: Accepted (2026-09-17). Cara kerja mengikat setelah research + requirements + technical docs terkumpul:
> kita tidak lagi kerja berdasarkan "fitur apa yang mau dibuat", melainkan **layered execution plan** dari fondasi sampai release.
> Hubungan dengan kontrak phase (`AGENTS.md`, `docs/README.md`): **phase mengatur urutan fitur (P1→P7),
> layer mengatur kedalaman teknis tiap phase**. Jika bertentangan, `AGENTS.md` §7 menang (phase doc didahulukan,
> perubahan kontrak = update doc dulu).

```text
                    MAX ISLAND
                        │
                        ▼
┌─────────────────────────────────────────────┐
│ LAYER 0  Engineering Foundation             │
├─────────────────────────────────────────────┤
│ LAYER 1  Domain / Core                      │
├─────────────────────────────────────────────┤
│ LAYER 2  Contracts & Event System            │
├─────────────────────────────────────────────┤
│ LAYER 3  Application / Feature Services      │
├─────────────────────────────────────────────┤
│ LAYER 4  Infrastructure                      │
├─────────────────────────────────────────────┤
│ LAYER 5  Windows Platform                    │
├─────────────────────────────────────────────┤
│ LAYER 6  UI / Presentation                   │
├─────────────────────────────────────────────┤
│ LAYER 7  Integration                         │
├─────────────────────────────────────────────┤
│ LAYER 8  Customization                       │
├─────────────────────────────────────────────┤
│ LAYER 9  Security & Privacy                  │
├─────────────────────────────────────────────┤
│ LAYER 10 Observability & Diagnostics         │
├─────────────────────────────────────────────┤
│ LAYER 11 Testing & Quality                   │
├─────────────────────────────────────────────┤
│ LAYER 12 Performance                         │
├─────────────────────────────────────────────┤
│ LAYER 13 Packaging & Release                 │
└─────────────────────────────────────────────┘
```

Urutan implementasi sedikit berbeda dari urutan gambar: testing/security/performance/observability
**tidak menunggu sampai akhir** — mereka cross-cutting (lihat § Cross-cutting).

## LAYER 0 — Engineering Foundation

Lock dulu sebelum kode fitur apa pun:

```text
Repository
Build system
Dependency management
Coding standards
CI
Branch strategy
Versioning
Documentation conventions
```

Deliverable:

```text
✓ repo
✓ build
✓ CI
✓ lint/format
✓ test runner
✓ CODEOWNERS
✓ CONTRIBUTING.md
```

(v1 minimal: `package.json` + test runner + `.gitignore`; CI/CODEOWNERS/CONTRIBUTING menyusul saat repo masuk git hosting.)

**Definition of Done:**

```text
git clone
    ↓
build
    ↓
test
    ↓
PASS
```

## LAYER 1 — Domain / Core

Otaknya. Konsep yang **tidak tahu Windows dan tidak tahu UI**:

```text
Time
State
Result
Errors
Domain Events
Identifiers
```

Untuk Pomodoro:

```text
IDLE
RUNNING
PAUSED
COMPLETED
BREAK
```

Deliverable: `✓ domain model ✓ state machine ✓ domain invariants ✓ unit tests`.
Core harus bisa dites **tanpa membuka UI**. (Maps ke P2–P3, ADR-001/003.)

## LAYER 2 — Contracts & Event System

Komunikasi antar-component — backbone MAX Island:

```text
packages/contracts/
PomodoroStarted / PomodoroPaused / PomodoroCompleted
MediaChanged / NotificationReceived
```

Command:

```text
StartPomodoro / PausePomodoro / ResetPomodoro
```

Alur:

```text
Command → Service → Domain State → Event → Subscribers
```

(Maps ke P2: bus→queue→reducer, kontrak event `phase-2-state-event.md` §2.2.)

## LAYER 3 — Application / Feature Services

Domain logic dijadikan feature yang bisa dipakai app — **tanpa UI**:

```text
PomodoroService  → start / pause / resume / reset / complete / break / persist / recover
MediaService
NotificationService
ConfigurationService
```

(Maps ke P3–P4.)

## LAYER 4 — Infrastructure

Kemampuan menyimpan dan menjalankan state. Core tidak tahu storage-nya apa:

```text
Persistence (abstraction → local storage)
Configuration
Logging
Dependency Injection
Serialization
```

(Maps ke P5–P6: electron-store+ajv, atomic-store, logger. Lihat putusan konflik ADR-004 di
`research/2026-09-17-system-architecture.md` §2.2.)

## LAYER 5 — Windows Platform

Baru masuk Windows. Yang paling awal = **windowing** (belum perlu cantik —
yang penting window system-nya benar):

```text
Transparent / Borderless / Always-on-top / Top-center
DPI-aware / Multi-monitor / Fullscreen handling
System / Notifications / Media / Audio / Display / Startup
```

Target pertama:

```text
Windows Desktop
       ↓
┌─────────────────────┐
│    MAX ISLAND       │
└─────────────────────┘
```

(Maps ke P1 + P4: `docs/window-overlay.md`, spike GSMTC/foreground/notif-listener.)

## LAYER 6 — UI / Presentation

Baru bikin Dynamic Island serius. UI **tidak memiliki business logic**:

```text
UI/ ├── Island ├── Components ├── Themes ├── Animations └── Settings
```

Alur:

```text
Core State → Application Service → Event → View Model → MAX Island
```

State: `COLLAPSED / EXPANDED / TRANSITIONING`. Module: `POMODORO / MEDIA / NOTIFICATION / MIC / DOWNLOAD / AI`.
(Maps ke P1 shell + P5 settings; aturan: semua keputusan tampil via reducer P2.)

## LAYER 7 — Integration

Hubungkan dunia luar. Integration **tidak boleh langsung mengubah UI**:

```text
Spotify → Spotify Adapter → Media Contract → MAX Island
(github / browser / ...)
```

Adapter statis `{match, map, commands}` + allowlist; tanpa dynamic loading di v1 (ADR-005).
(Maps ke P4.)

## LAYER 8 — Customization

Setelah core experience stabil: appearance, position, size, transparency, blur,
animation, modules, Pomodoro settings, behavior. Profile: `Default / Focus / Gaming / Minimal`.

```text
User Settings → Configuration Service → State → UI
```

(Maps ke P5.)

## LAYER 9 — Security & Privacy

Bukan final checklist — di tahap ini harden seluruh system. Audit:
permissions, secrets, IPC, plugins, filesystem, network, external integrations, logging, telemetry, AI tools.

Threat model:

```text
                    MAX
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
      Windows     Network    Plugins
          │          │          │
          └──────────┼──────────┘
                     ▼
                  Assets
```

Prinsip: least privilege, capability-based access, secure defaults, no unnecessary telemetry, fail-safe.
(Maps ke P6 + ADR-006; diegakkan tiap phase via `AGENTS.md` §5.)

## LAYER 10 — Observability

Menjawab: "kalau user bilang rusak, kita tahu kenapa?" Structured logging, diagnostics,
crash handling, performance metrics, health state, debug mode. Contoh metric:
`timer_drift_ms, startup_duration, memory_usage, integration_failure, window_creation_failure`.
(Maps ke SER-007, ERR-007, `architecture.md` §Error boundaries.)

## LAYER 11 — Testing & Quality

Full validation (dikerjakan sepanjang jalan, dipanen di sini):

```text
Unit / Integration / E2E / Architecture / Security / Performance / Regression
```

Traceability:

```text
FR-POM-001 → Implementation → Unit Test → Integration Test → E2E Test
```

Architecture test: `Core → Windows` harus **FAIL**; `Windows → Core abstraction` harus **PASS**.
(Maps ke `docs/requirements/12-testing.md` + `13-traceability.md`.)

## LAYER 12 — Performance

Profiling serius — tanpa angka karangan. Ukur: startup time, idle CPU/RAM, GPU,
animation FPS, timer drift, power usage, notification latency.

```text
Measure → Profile → Identify bottleneck → Optimize → Measure again
```

(Maps ke P6 + NFR-PERF; budget = titik awal, bukan SLA.)

## LAYER 13 — Packaging & Release

Jadikan produk yang bisa dipakai orang:

```text
Source → Build → Test → Package → Sign → Installer → Release
```

Butuh: versioning, installer, code signing, update mechanism, migration, rollback, release notes, changelog.
(Out-of-scope sampai P6/P7 hijau.)

## QUALITY GATES (berjalan dari awal sampai akhir)

Setiap layer tidak boleh sekadar "udah selesai":

```text
LAYER → Implementation → Tests → Review → Metrics → Security check → Definition of Done → NEXT LAYER
```

Contoh Layer Pomodoro:

```text
Pomodoro Engine → State machine → Persistence → Sleep/Wake
→ Unit tests → Integration tests → Performance → Review → DONE
```

## Roadmap final

```text
RESEARCH → REQUIREMENTS → TECHNICAL DESIGN
→ 0. ENGINEERING FOUNDATION → 1. DOMAIN/CORE → 2. CONTRACTS/EVENTS
→ 3. APPLICATION SERVICES → 4. INFRASTRUCTURE → 5. WINDOWS PLATFORM
→ 6. UI/ISLAND → 7. INTEGRATIONS → 8. CUSTOMIZATION
→ 9. SECURITY/PRIVACY → 10. OBSERVABILITY → 11. TEST/QA
→ 12. PERFORMANCE → 13. RELEASE
```

## Cross-cutting (koreksi penting)

Security, testing, observability, performance **bukan pekerjaan yang baru dimulai setelah Layer 8**:

```text
              SECURITY
                 │
TESTING ───── MAX ISLAND ───── OBSERVABILITY
                 │
            PERFORMANCE
```

Setiap layer membawa mini-gate keempatnya. Ini lebih dekat ke cara membangun
project production-grade daripada pola "backend → frontend → selesai".

## Mapping Layer ↔ Phase (komposisi, bukan duplikasi)

| Phase (fitur, mengikat via AGENTS.md) | Layer yang dieksekusi di dalamnya |
|---|---|
| P1 — Window System | L0, L5 (windowing), L6 (shell dasar) + mini-gate L9/L10/L11 |
| P2 — State/Event | L1, L2, L10 (transition log), L11 (5 unit test) |
| P3 — Pomodoro | L1, L3 (PomodoroService), L4 (persist timer), L11 |
| P4 — Sys Integration | L7, L3 (services), L5 (providers), L9 (consent) |
| P5 — Customization | L8, L4 (config store), L6 (settings UI) |
| P6 — Perf+Sec | L12, L9 (audit penuh), L10 |
| P7 — AI Agent | L3 (AI actor), L9 (tiers ADR-006), L10 (privacy log) |

L13 jalan setelah P6/P7 hijau. L0 sekarang.
