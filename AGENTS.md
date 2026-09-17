# AGENTS.md — Kontrak Generate Island Dynamic (Phased, FAANG-Clean)

> File ini mengikat SEMUA agent (manusia + AI) yang generate code di repo ini.
> Prinsip: **bertahap per phase, kecil + teruji + bisa di-review**, bukan big-bang.

## 1. Phase order (EXACT, dilarang ubah urutan/nama)

```text
Phase 1 — Windows Overlay + Window System
Phase 2 — State/Event Architecture
Phase 3 — Pomodoro Engine
Phase 4 — Windows System Integration
Phase 5 — Customization
Phase 6 — Performance + Security
Phase 7 — AI / Agent Layer
```

- Spec tiap phase: `docs/phase-N-*.md`. Index: `docs/README.md`. Detail overlay: `docs/window-overlay.md`. Riset: `research/`.
- Gate: dilarang mulai Pn+1 jika DoD Pn belum hijau. Setiap diff WAJIB tulis `Phase: N` di pesan + sebut DoD item yang dipenuhi.
- Perubahan kontrak antar-phase = update doc phase terkait dulu, baru code.

## 2. Repo structure (clean, phase-aligned, Electron monorepo)

```text
apps/desktop/src/
  main/          # P1 — IslandWindowApi saja yang boleh sentuh BrowserWindow
                 # + P3 TimerEngine host + P4 provider hosts + P6 infra
  preload/       # contextBridge whitelist IPC saja (composition)
  renderer/
    shell/       # render IslandSurfaceState saja (dormant/compact/peek/expanded)
    settings/    # form + live preview (debounce), tanpa tulis store langsung
packages/
  core/          # P2 — MURNI: types, reducer, queue, history, timeout-registry (0 dep)
  pomodoro/      # P3 — TimerEngine (deadline-based, main-process)
  media/         # P4 — normalized now-playing + intents (transport di platform)
  notifications/ # P4 — transient model + deep-link intents
  configuration/ # P5 — IslandConfig types, ajv schema, sanitize, migrate, defaults
  contracts/     # wire contracts: Events/Commands/DTOs (perubahan = update doc dulu)
  telemetry/     # P6 — local-only logs/metrics/diagnostics (no network)
platform/windows/
  windowing/     # P1 — BrowserWindow factory, DIP, hit-region, tray, startup
  media/         # P4 — GSMTC wrapper (windows-media-sessions)
  notifications/ # P4 — UserNotificationListener + toast sender
  system/        # P4 — foreground/battery/network/FS-watcher/clipboard/powerMonitor
  native/        # DEFERRED — kecil, hanya bila spike membuktikan butuh (ADR dulu)
integrations/
  spotify|github|browser/  # veneer tipis di atas provider generik, tanpa transport sendiri
tests/
  integration/   # P2+P3, P2+P5 (flag-off-drop, restore-history)
  e2e/           # journeys tercatat (otomasi formal P6)
  performance|security|architecture/  # PERF-001 notes, TC-SEC-001 evidence, executable rules
  bootstrap.test.js  # L0 toolchain canary
tools/ (build/test/benchmark/codegen/release)  configs/  assets/  docs/00-10/  research/  images/
```

Dependency rule (ditegakkan saat review + `npm run lint` + CI `architecture.yml`):

- `packages/core`, `packages/contracts`, `packages/configuration` → tidak boleh import `electron`, `react`, `apps/*`. (P2 tetap zero-dep total.)
- `apps/desktop/src/renderer/*` → tidak boleh import `main/*`. Komunikasi hanya via preload whitelist IPC.
- `platform/windows/windowing` → satu-satunya pemilik `BrowserWindow` island. Phase lain pakai `IslandWindowApi`.
- `packages/pomodoro`, `platform/windows/*`, `integrations/*` → hanya emit `IslandEvent` ke bus P2, tidak render langsung.
- `packages/configuration` → tanpa Electron kecuali adapter tipis di app infra (store path `%APPDATA%`).

## 3. FAANG-clean code format (wajib)

- Satu file = satu tanggung jawab. Max ~200 baris/file logika (pecah jika lebih). Fungsi max ~50 baris, cyclomatic rendah.
- Naming: `PascalCase` types/components, `camelCase` fungsi/variabel, `SCREAMING_SNAKE` konstanta, `kebab-case` file. Tanpa singkatan samar (`d`, `tmp2`).
- Export eksplisit per file (`export interface …`), tanpa `export *` liar. Tanpa `any` (pakai `unknown` + narrow). `strict:true`, `noUncheckedIndexedAccess` bila TS.
- Error handling: fail-safe + pesan jelas. Config korup/import rusak/timer korup → backup `.bak` + defaults + banner, tidak pernah crash. Kumpulkan semua error validasi (bukan fail-fast satu).
- Waktu: reducer/engine terima `now: number` injection. Dilarang `Date.now()` di dalam reducer murni. Deadline = epoch-ms UTC; display/history ISO UTC.
- Komentar: WHY, bukan WHAT. Setiap magic number (4000, 500ms, cap 20) wajib rujuk doc (`// P2 §2.1: transient default`).
- Bahasa: code + identifier English. Doc/chat boleh Indonesia.

## 4. Generation protocol (cara generate)

1. Baca dulu: `docs/README.md` → `docs/phase-N-*.md` target → sumber research terkait. Jangan mengarang API.
2. Rencana kecil: 1 diff = 1 DoD item. Sebut file yang dibuat/diubah + test yang menutupinya.
3. Ikuti pola repo referensi yang sudah diputuskan: P1 `frame:false…pop-up-menu` (§window-overlay), P2 reducer+queue+history (§state-system), P3 deadline engine (§pomodoro), P4 3 provider generik (§max-island), P5 electron-store+ajv+migrations (§customization).
4. Setiap phase sertakan/verifikasi:
   - P1: tidak ada `focus()` agresif; hit-region toggle; workArea DIP; matriks DPI/monitor/taskbar.
   - P2: unit test 5 kasus (§2.4 phase-2); 0-dep check packages/core.
   - P3: freeze/sleep/kill/clock-jump checklist (§3.3 phase-3); tulis hanya transisi.
   - P4: acceptance Spotify+YouTube; media popup 3–5s, tidak tahan island; polling ≤1Hz.
   - P5: 5 unit test config (§5.3 phase-5); apply tanpa reload; flag-off = drop event.
   - P6: ukur idle CPU/RAM + cold start; grep audit (nodeIntegration/require-user/openExternal/tulis-di-tick).
   - P7: ai-off = no-spawn+drop; no-key = no-network + launcher tetap berguna; privasi log.
5. Dilarang: big-bang multi-phase dalam 1 diff; ubah kontrak event/schema/window-API tanpa update doc; tambah dependency baru tanpa catat alasan + alternatif yang ditolak (ikuti tabel Options Considered di research).
6. Dependency baru default DITOLAK kecuali: dibutuhkan phase + tidak bisa ~50 baris sendiri + dicatat di diff. P2 tetap zero-dep.

## 5. Forbidden (auto-reject saat review)

- `if pomodoro … else if music` di renderer. Semua keputusan tampil via reducer P2.
- `remaining -= 1000` counter, `requestAnimationFrame` sebagai timer, `Date.now()` di reducer.
- SMTC-only untuk kontrol app lain (wajib GSMTC `GetCurrentSession/GetSessions/Try*`).
- `transparent + CSS blur` diklaim sebagai Acrylic. `backgroundMaterial` tanpa flag + fallback.
- `require(userPath)` / dynamic plugin loading / `openExternal` tanpa allowlist / `nodeIntegration:true`.
- Tulis store tiap tick render. Suara remote-fetch saat transisi. Exfil clipboard/notif tanpa consent.
- Menjanjikan: tembus fullscreen-exclusive, ikut virtual-desktop, mic-pasti, Wi-Fi BSSID, calendar sync, Discord voice lokal di v1.

## 6. Review checklist (paste di setiap PR/diff besar)

```text
Phase: N — <nama exact>
- [ ] Doc phase dibaca + DoD item <x> dipenuhi, kontrak tak berubah (atau doc diupdate)
- [ ] Dependency rule §2 + forbidden §5 lolos
- [ ] Test baru/updated hijau (unit + integrasi terkait)
- [ ] Magic numbers rujuk doc phase; error path backup+defaults dibuktikan
- [ ] Tidak ada dependency baru (atau alasan + alternatif tercatat)
```

## 7. Sumber kebenaran sengketa

Urutan menang: `docs/phase-N-*.md` > `docs/requirements.md` (ID acceptance) + `docs/architecture.md` + `docs/state-machine.md` + `docs/adr/` > `docs/window-overlay.md` > `research/*.md` > `images/` (hanya visual ref) > klaim chat. Angka budget P6 = titik awal, tuning hanya via ukur, bukan opini.
