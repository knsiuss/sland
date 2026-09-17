# Requirements — MAX Island (v1)

> Sumber: hasil riset di `research/` (windows overlay, state system, pomodoro engine, performance, system/app integration, customization) + `docs/window-overlay.md`.
> Status: Proposed v1. Setiap requirement punya ID stabil agar bisa dirujuk Architecture doc dan acceptance test.
> Konvensi: **MUST** = wajib v1, **SHOULD** = target v1 bila spike lolos, **DEFERRED** = eksplisit bukan v1.

## Functional Requirements

### Island shell (overlay)

- **FR-01 MUST — Island muncul top-center.** Satu `BrowserWindow` frameless transparent alwaysOnTop `level: 'pop-up-menu'`, posisi dari `workArea` dalam DIP (bukan `bounds`), dua ukuran fixed collapsed/expanded via `setSize`. Ref: windows doc, overlay doc §1–3, §7–8.
- **FR-02 MUST — Expand/collapse.** Expand via hover (jika `expandOnHover`) / klik; collapse via leave + timeout / dismiss; animasi morph collapsed↔expanded. Ref: state-system shell states, customization behavior.
- **FR-03 MUST — Auto-hide.** Saat idle (queue kosong + tanpa persistent + `autoHide=true` + `autoHideIdleSeconds` habis) masuk `Dormant`. Media-event tidak boleh menahan island (pelajaran Windhawk #4738). Ref: state-system, windows doc.
- **FR-04 MUST — Posisi dapat diubah user.** Preset `top-center | top-left | top-right | custom` + pilihan monitor (`primary | cursor | id`). Custom `x,y` di-clamp ke `workArea`; fallback `top-center` bila display hilang. Ref: customization §4, overlay §7–8.
- **FR-05 MUST — Click-through margin.** Pill bisa diklik (`ignore:false`); hanya margin transparan yang `ignore:true,forward:true` berbasis hit-region. Kontrol interaktif `no-drag`. Ref: overlay §5–6.
- **FR-06 SHOULD — Fullscreen behavior.** Opsi `hide | overlay | minimize`; default aman `hide` (overlay bisa tertutup fullscreen-exclusive, jangan paksa fokus). Ref: overlay §9, customization schema.
- **FR-07 MUST — Startup + tray.** `setLoginItemSettings` untuk startup; tray wajib ICO dengan menu show/hide, quit, toggle startup. Ref: overlay §13–14.

### Pomodoro

- **FR-10 MUST — Start/pause/resume/reset/skip.** Pause membekukan deadline (`remainingOnPause = targetEnd - now`, `targetEnd = null`); resume membuat deadline baru (`now + sisa`). Skip = `completePhase(skipped=true)`. Ref: pomodoro doc §4.
- **FR-11 MUST — Fase focus/short-break/long-break.** `cycleCount % sessionsPerCycle == 0 → longBreak` else `shortBreak`; setelah longBreak `cycleCount = 0`. Durasi configurable (clamp 1–180 mnt, `sessionsPerCycle` 1–12). Ref: pomodoro §9.
- **FR-12 MUST — Timer survive suspension.** Deadline-based (`targetEndEpochMs = Date.now() + durationMs`), tick 250–500 ms hanya render. Sleep/lock = elapsed default; reconcile saat `resume`/`unlock-screen`/`visible`/`focus`/tick; sesi selesai saat tidur → `completedWhileSuspended=true` + notif saat bangun. Jangan andalkan handler `suspend` sempat jalan (Win11 24H2 laptop). Ref: pomodoro §1, §5.
- **FR-13 MUST — Crash recovery.** Boot baca `PersistedTimer`: paused → kembali paused; running valid → lanjut/selesaikan tertunda (`recoveredFromCrash`); korup → idle + backup `.bak`. Ref: pomodoro §6–7.
- **FR-14 MUST — History append-only.** Satu record per fase berakhir (idempotent via `phaseRunId`), skema UTC ISO + `outcome` (`completed|skipped|abandoned|completedWhileSuspended|recoveredFromCrash`). Statistik dari history, bukan dari counter aktif. Ref: pomodoro §8.
- **FR-15 MUST — Notifikasi + suara saat fase selesai.** Pemicu = deadline check. Notifikasi OS primer (`new Notification`), suara lokal pendek sekunder (preload setelah gesture, hormati autoplay policy). Ref: pomodoro §10.
- **FR-16 SHOULD — Auto-start dengan konfirmasi.** Default v1 off atau countdown-delay 10 detik + tombol Batal. Perubahan config saat running berlaku sesi berikutnya. Ref: pomodoro §9, risiko R4.

### Media & system signals (v1 vs tunda)

- **FR-20 MUST — Kontrol media generik via GSMTC.** Baca + kontrol (play/pause/next/previous + title/artist/artwork/timeline) untuk SEMUA app GSMTC (Spotify, Chrome/Edge YouTube) tanpa API key, polling 500–1000 ms + event `CurrentSessionChanged`. Jangan pakai SMTC-only. Ref: windows doc, integration §1.
- **FR-21 MUST — Media-event transient.** Track-change/play-pause hanya popup 3–5 detik; saat Pomodoro persistent aktif, media tidak rebut slot utama (secondary bubble / queue). Ref: state-system priority 40 vs 20.
- **FR-22 MUST — Modules on/off.** `modules.{pomodoro,music,notification,download,microphone,ai}: boolean`. Flag `false` = actor tidak di-spawn + event kategorinya di-drop di bus. Ref: customization §5.
- **FR-23 MUST — Battery + online/offline.** `Battery.AggregateBattery`/`PowerManager` (fallback `GetSystemPowerStatus`) + `NetworkInformation`/`NetworkStatusChanged` tanpa izin khusus. Ref: integration §4–5.
- **FR-24 MUST — Clipboard item saat ini.** `clipboard.readText/readImage/readHTML` via main. Histori Win+V TIDAK terbaca (tidak ada API publik). Ref: integration §7.
- **FR-25 MUST — Foreground detect + URI launch.** `GetForegroundWindow` + allowlist (`Code.exe`, `chrome.exe`, `msedge.exe`, `discord.exe`, `explorer.exe`) untuk `AppPresence`; aksi via URI launcher (`vscode://`, `spotify:`, …) — launch saja, bukan observasi state. Ref: integration §11 + app integration.
- **FR-26 SHOULD — Mirror notifikasi bersyarat.** `UserNotificationListener` hanya dengan consent eksplisit; desain untuk izin-ditolak (list kosong ≠ tidak ada notif). Ref: integration §6.
- **FR-27 DEFERRED — Mic pasti, Wi-Fi detail, calendar sync, paksa Focus OS, brightness eksternal, Discord voice-state, GitHub live, download browser, plugin dinamis.** Mic hanya heuristik ber-confidence; Wi-Fi SSID/BSSID butuh location consent; calendar butuh OAuth/Graph; `TryStartFocusSession` butuh LAF token (deteksi saja boleh); brightness eksternal DDC/CI sering no-op; plugin dinamis butuh RFC keamanan terpisah. Ref: integration matriks + customization §5.

### Customization & profiles

- **FR-30 MUST — Schema settings berversi.** `configVersion: 1` + enum/pattern/clamp, `additionalProperties: false`, `sanitizeConfig` di `src/shared` (main + renderer). Contoh tanpa versi ditolak/dimigrasi. Ref: customization §2 + schema v1.
- **FR-31 MUST — Gagal aman.** File korup/import rusak tidak pernah crash: backup `.bak` + fallback defaults + pesan error terkumpul (fatal tolak semua, unknown keys strip + warning). Ref: customization §2, risiko R1–R3.
- **FR-32 MUST — Apply instan tanpa reload.** Token → CSS vars (`--accent`, `--island-opacity`, `--island-radius`, `--island-anim`) + `nativeTheme.themeSource` (default `system`) + `setBounds`/`setAlwaysOnTop` + broadcast `config:changed`. Tulis debounce 100–200 ms untuk slider; jangan tulis tiap tick. Ref: customization §3–4.
- **FR-33 MUST — Appearance/bahavior terkontrol.** `theme system|light|dark`, `accent ^#[0-9a-fA-F]{6}$`, `transparency 0.4–1.0`, `blur` flag forward-compatible default `false` (blur real out-of-scope v1), `size compact|comfortable|large|custom`, `radius 8–32`, `animation spring|fade|none`. `behavior`: `autoHide`, `autoHideIdleSeconds 3–60`, `expandOnHover`, `keepOnTop`, `workspaceBehavior`, `fullscreenBehavior`. Ref: customization schema.
- **FR-34 MUST — Profiles + import/export aman.** Satu store + `profiles` map + `activeProfileId` (jangan dua desain). Export via save dialog; import via parse → ajv → backup sebelum overwrite. Ref: customization §6.

### State system (event-driven, bukan `if`)

- **FR-40 MUST — Satu State Manager memutuskan tampilan.** Sumber hanya emit `IslandEvent` ternormalisasi (`id/type/category/priority/timeoutMs/timestamp/payload/sticky`); UI hanya render `IslandSurfaceState` (`dormant/compact/peek/expanded`). Tambah sumber = tambah actor, tanpa edit renderer. Ref: state-system arsitektur + kontrak event.
- **FR-41 MUST — Preemption deterministik.** `incoming.priority > current` → preempt + save history; `==` → FIFO; `<` → queue sort `(priority desc, timestamp asc)`. Tabel awal: 100 critical pinned, 80 urgent 5 s, 60 transient 4 s, 40 media-event 3–5 s, 20 persistent sticky, 0 idle. Ref: state-system priority.
- **FR-42 MUST — Timeout + restore.** Setiap `Peek`/alert wajib `timeoutMs` + cancel-on-exit; hover/focus/blur pause (simpan remaining), leave resume (recompute `endTime`); restore `history.top` bila valid else queue-head else dormant. Ref: state-system timeout/interruption.
- **FR-43 MUST — Burst aman.** Mailbox satu-per-satu + dedupe `id` + cap ~20 + overflow collapse (`+N lainnya`) + debounce render 100–200 ms + tick 1 s hanya update payload. Ref: state-system concurrent.

## Interface Requirements

> Bukan cuma UI: setiap interface yang disentuh island — user-facing, OS, dan eksternal.
> ID `UI-/SYS-/EXT-` adalah alias stabil; kolom Maps to mengikat ke FR/NFR agar tidak ada skema ganda.

### User Interface

| ID | Requirement | Level | Maps to |
|---|---|---|---|
| UI-001 | Island must have collapsed state (compact pill: clock / Pomodoro countdown / now-playing slot). | MUST | FR-01, FR-02 |
| UI-002 | Island must have expanded state (controls: play/pause/next, Pomodoro pause/skip, notification actions). | MUST | FR-02 |
| UI-003 | Expansion must use animated transition (spring morph collapsed↔expanded, `transform`/`opacity` only, ≤300 ms). | MUST | FR-02, NFR-03 |

### System Interface

| ID | Requirement | Level | Maps to |
|---|---|---|---|
| SYS-001 | Windows notification integration — mirror via `UserNotificationListener` only with explicit consent; revoked permission yields empty list (treated as "no data", never fatal). | SHOULD, conditional | FR-26, NFR-06 |
| SYS-002 | Windows media integration — read + control ALL GSMTC apps (no per-app adapter, no API key), polling 500–1000 ms + `CurrentSessionChanged`. SMTC-only is a failure mode. | MUST | FR-20, FR-21 |
| SYS-003 | Windows audio/microphone state — v1 MUST NOT promise an exact mic-active boolean (no public WinRT API); WASAPI/process heuristic with confidence label only. | DEFERRED (exact), heuristic allowed | FR-27 |
| SYS-004 | Windows display/monitor APIs — cursor-based target display, `workArea` DIP layout, `display-added/removed/display-metrics-changed` subscription, 100–250% DPI matrix. | MUST | FR-01, FR-04, NFR-04 |

### External Interface (phased, "nanti" items)

| ID | Target | v1 posture (no brutal per-app integration) | Phase |
|---|---|---|---|
| EXT-001 | Spotify | No dedicated adapter — via generic GSMTC provider. | P4 |
| EXT-002 | GitHub | Deep-link + optional REST polling with user token; live sync deferred. | P4 (live deferred) |
| EXT-003 | Browser (Chrome/Edge, YouTube) | Via generic GSMTC provider, same as EXT-001. No extension/native-messaging. | P4 |
| EXT-004 | AI provider | BYOK, local-first; no key = launcher mode (Summarize/Search/Open App), zero network calls. | P7 |

## State & Event Requirements

> MAX Island pada dasarnya adalah event-driven UI, jadi state/event dipisahkan dari interface.
> Content (apa yang tampil) orthogonal terhadap visibility (seberapa besar) — lihat `state-machine.md` §1.

### Content states

| State | Kind | Behaviour |
|---|---|---|
| IDLE | Fallback (clock) when queue empty and no persistent owner. | Surface `dormant`; FR-03 |
| POMODORO | Persistent (sticky), default compact owner. | FR-11–15; wins over MEDIA |
| MEDIA | Persistent-low + transient events (track-change/play-pause popup 3–5 s). | FR-20–21; secondary bubble while Pomodoro owns slot |
| NOTIFICATION | Transient 4 s, preempt-then-yield to incumbent. | FR-41–42 |
| DOWNLOAD | FS-watcher folder progress (browser-internal progress unreadable — no OS global download manager). | FR-27 (browser deferred) |
| MICROPHONE | Heuristic indicator with confidence label; never a hard system promise in v1. | SYS-003, FR-27 |
| AI | Transient answer / listening bubble; pinned only on explicit user pin. | P7 (`phase-7-ai-agent.md`) |

Note: EXPANDED is NOT a content state — it is a visibility level applicable to any content above (`state-machine.md` §2: `DORMANT → COMPACT → EXPANDED`, user-pin wins over timeouts).

### Events (proposed → canonical P2 contract)

| Proposed | Canonical (`phase-2-state-event.md` §2.2) | Notes |
|---|---|---|
| POMODORO_STARTED | `POMODORO.STARTED` (20, sticky, no timeout) | — |
| POMODORO_PAUSED | `POMODORO.PAUSED` (NEW — persistent bookkeeping, no surface change) | Pause freezes deadline; surface stays |
| POMODORO_COMPLETED | `POMODORO.FINISHED` (80, expanded 5 s) | — |
| MEDIA_STARTED | `MEDIA.PLAY_PAUSE` (play) | — |
| MEDIA_PAUSED | `MEDIA.PLAY_PAUSE` (pause) | — |
| MEDIA_CHANGED | `MEDIA.TRACK_CHANGED` (40, 3–5 s) | Never steals Pomodoro slot |
| NOTIFICATION_RECEIVED | `NOTIFY.RECEIVED` (60, 4000 ms) | — |
| MIC_ACTIVATED / MIC_DEACTIVATED | `MIC.STATE_CHANGED {active, confidence}` (NEW — heuristic only) | SYS-003; exact state deferred |
| (interaction/timeout, implied) | `USER.HOVER/LEAVE/CLICK/DISMISS`, `SYSTEM.TIMEOUT/QUEUE_DRAINED` | Already in contract |

- **STATE-001 MUST — Single surface owner.** Only one primary island state may control the visual surface at a time (single reducer decision; renderer renders `IslandSurfaceState` only). Maps to FR-40.
- **STATE-002 MUST — Controlled preemption.** Higher-priority events may temporarily interrupt lower-priority states (`incoming.priority > current` → preempt + push history; equal → FIFO; lower → sorted queue). Maps to FR-41.
- **STATE-003 MUST — Restore after transient.** After transient events expire, the previous persistent state must be restored (validate `history.top` → queue head → dormant; countdown resumes remaining, never restarts). Maps to FR-42.

## Non-Functional Requirements

> Angka `X` = placeholder, diisi setelah benchmarking lokal (lihat cara ukur di tiap item). Budget performance MAX (CPU 8% / RAM 500 MB / GPU 15%) adalah batas atas, bukan target — target desain tetap idle negligible. Ref: `research/2026-09-17-performance-max-island.md`.

### Performance

- **NFR-PERF-001 MUST — Idle CPU usage must remain below X%.** Aturan `event → render → return idle`: tidak ada interval <500 ms permanen, tidak ada `rAF` saat statis; Pomodoro tick 250–500 ms hanya saat running; media 500–1000 ms + event `CurrentSessionChanged`; sysinfo opt-in ≥2000 ms. Cara ukur: collapsed statis 60 detik via `process.getCPUUsage()` + Task Manager. Titik awal: CPU≈0% (negligible); X diisi setelah spike ukur idle. Menggantikan NFR-01 lama.
- **NFR-PERF-002 MUST — Island animation must target 60 FPS.** Hanya properti compositor (`transform/opacity`), durasi ≤300 ms, `will-change` sementara; larang animasi `width/height/blur/shadow` per-frame; HW acceleration ON (jangan `disableHardwareAcceleration`); pill solid/semi-solid + CSS `border-radius`, tanpa acrylic/blur belakang di v1. Cara ukur: spike expand/collapse, observasi tidak ada jank + GPU spike sesaat lalu turun. Menggantikan NFR-03 lama.
- **NFR-PERF-003 SHOULD — Application startup must complete within X seconds.** Teknik: defer `require()`, bundle renderer, preload tipis, `Menu.setApplicationMenu(null)`, lazy-load settings/media modules, tidak ada autoplay media saat boot, stagger kerja just-in-time. Cara ukur: waktu `app.ready` → `ready-to-show` + `showInactive` di mesin target; X diisi setelah diukur (jangan janjikan angka sebelum ada run lokal). Bagian dari NFR-08 lama (baterai mengikuti idle CPU + GPU residency — ukur, bukan teori).

### Memory

- **NFR-MEM-001 MUST — Memory consumption during idle must remain below X MB.** Batas atas MAX = 500 MB untuk satu window kecil; target desain jauh di bawahnya bila tidak bocor. Teknik: satu window, preload minimal, bersihkan listener/IPC (`removeListener` saat destroy), tidak ada polling agresif. Cara ukur: `process.getProcessMemoryInfo()` + Task Manager saat collapsed statis. Menggantikan NFR-02 lama.

### Reliability

- **NFR-REL-001 MUST — Timer state must survive application restart.** Deadline-based (`targetEndEpochMs`, bukan decrement counter); persist `PersistedTimer` tiap transisi + `hidden`/`blur` + `suspend`/`lock-screen` (best-effort) + throttle 5 detik; boot reconcile: paused → paused, running valid → lanjut/selesaikan tertunda (`recoveredFromCrash`), korup → idle + backup `.bak`. Drift <1 detik per 25 menit aktif; freeze/throttle/sleep self-healing di tick berikutnya. Ref: pomodoro doc. (Mencakup FR-12/13 + NFR-07 lama.)
- **NFR-REL-002 MUST — Unexpected termination must not corrupt persistent settings.** Semua tulis atomik (temp + rename, pola electron-store); validasi ajv sebelum tulis; file korup/import rusak → backup `.bak` + fallback defaults + pesan error terkumpul, tidak pernah crash. `appVersion` disimpan di persist untuk migrasi. Uji: kill saat running/paused, edit manual JSON jadi korup. (Mencakup NFR-05 + FR-31 lama.)

### Compatibility

- **NFR-COMP-001 MUST — Windows 11 support (+ Windows 10 17763+).** Overlay `pop-up-menu` di atas taskbar; fallback solid untuk material; uji Win10 vs Win11 22H2+. Ref: overlay doc.
- **NFR-COMP-002 MUST — Multiple monitor configurations.** Target display via cursor (`getCursorScreenPoint` → `getDisplayNearestPoint`); subscribe `display-added/removed/display-metrics-changed`; posisi custom di-clamp ke `workArea`, fallback `top-center` bila display hilang. Uji: 2 monitor beda DPI + cabut-colok.
- **NFR-COMP-003 MUST — Different DPI scaling configurations.** Hitung layout dalam DIP; `scaleFactor` hanya logging; uji visual 100/125/150/200%+ sebelum klaim tajam. (NFR-COMP-002 + 003 menggantikan NFR-04 lama.)

### Usability

- **NFR-UX-001 MUST — Primary actions accessible within one interaction.** Play/pause/next, Pomodoro start/pause, dismiss notifikasi: maksimal 1 klik/hover dari state tampil tanpa membuka settings. Expanded berisi kontrol esensial (bukan halaman penuh). Ref: state-system expanded + FR-02.
- **NFR-UX-002 MUST — Island must not obstruct normal desktop workflow.** Default `ignore:false` hanya pada pill, margin transparan click-through (`ignore:true,forward:true`); tidak ada `focus()` agresif; tidak mencuri fokus saat muncul; fullscreen-exclusive boleh menutup overlay (default `hide`); auto-hide saat idle; tidak ada suara remote-fetch saat transisi. Ref: overlay §5–6, §9; windows doc risiko focus-stealing.

### Maintainability & observability (tambahan dari riset, ID stabil)

- **NFR-MAINT-001 MUST — Testability.** `core/events` dan `src/shared/config` murni tanpa Electron — unit-test Node saja (queue ordering, preemption, history restore, timeout cancel, dedupe/overflow, migrasi schema, accent invalid, file korup).
- **NFR-OBS-001 MUST — Observability minimal.** Log terstruktur `clockJumpSuspected`, `completedWhileSuspended`, `recoveredFromCrash`, config fallback, preemption/restore.

## Security Requirements

> Bagian khusus untuk MAX Island. Berlaku sejak v1; sub-bagian AI berlaku saat `modules.ai` dinyalakan (v1 default `false`).

- **SEC-001 MUST — Least privilege.** Tiap komponen hanya memegang kemampuan yang dibutuhkannya: renderer tidak punya Node/fs (`nodeIntegration:false`, `contextIsolation:true`, preload `contextBridge` minimal); provider sistem hanya membaca scope-nya (GSMTC baca/kontrol media, foreground baca judul proses allowlist, listener notifikasi hanya setelah consent). Tidak ada handler IPC generik ("jalankan X sembarang").
- **SEC-002 MUST — No unnecessary administrator privileges.** Instalasi dan runtime sebagai user biasa; tidak ada manifest admin/UAC; tidak ada tulis ke lokasi sistem; startup via `setLoginItemSettings` (registry user), bukan service/task terprivilege. Uji: instal + jalan penuh tanpa "Run as administrator".
- **SEC-003 MUST — Sensitive configuration stored securely.** Klasifikasi: settings biasa (`theme`, `position`) di `config.json` electron-store; **secret/token (mis. token GitHub bila dipakai nanti) tidak pernah di `config.json` plaintext** — wajib via `safeStorage` (DPAPI di Windows) atau credential store OS, dengan fallback aman (fitur terkait nonaktif + pesan jelas bila enkripsi tak tersedia). Tidak ada secret di log, crash report, atau file `.bak` yang ikut ter-commit. Uji: grep repo + `%APPDATA%` tidak ada token plaintext.
- **SEC-004 MUST — External integrations explicitly authorized.** Setiap integrasi keluar (notification listener, location untuk SSID, OAuth/Graph untuk calendar, REST GitHub bila ada token, `openExternal` URI) butuh opt-in eksplisit per-fitur dengan penjelasan + mudah dicabut; izin-dicabut = fitur nonaktif gracefully (list kosong ≠ error fatal). `openExternal` hanya ke allowlist skema/host (`vscode://`, `spotify:`, `https:` host allowlist) — tolak sisanya + log. Tanpa plugin loading dinamis di v1 (`require(userPath)` dilarang).
- **SEC-005 MUST — Plugins sandboxed by default (v1 = tidak ada plugin).** v1: Modules = boolean feature-flags, bukan load kode pihak-ketiga. Bila plugin system dibuka (v2+ via RFC): default deny — plugin tidak dapat akses arbitrary system resources; akses fs/network/system hanya via capability yang dideklarasikan + disetujui user; kontrak event berversi agar plugin pecah secara aman (ditolak load + pesan), bukan crash host.

### AI security (berlaku saat AI/Agent Layer aktif — arsitektur §AI)

- **AI-SEC-001 MUST — No privileged action without authorization.** AI tidak boleh mengeksekusi aksi terprivilege (ubah settings sistem, kontrol media di luar intent user, tulis file di luar scope, kirim data keluar) tanpa otorisasi eksplisit. Aksi dibagi tier: `read-only` (ringkas status) vs `low-impact` (tampilkan saran di island, perlu 1 klik) vs `privileged` (perlu konfirmasi eksplisit tiap kali, tidak boleh pre-authorized permanen). Default: AI hanya `read-only` + saran.
- **AI-SEC-002 MUST — Capability-based tool access.** AI hanya melihat/manggil tools yang diberikan untuk sesi itu (mis. `pomodoro.status`, `media.nowPlaying` vs `media.control` vs `config.write` — terpisah). Tidak ada tool generik (`shell.exec`, `fs.writeAnywhere`, `http.fetchAnywhere`). Setiap tool punya schema input tervalidasi + batas rate + audit log (siapa, kapan, argumen, hasil).
- **AI-SEC-003 MUST — Scoped filesystem access.** Akses file AI dibatasi ke direktori app (`%APPDATA%\<App>`) dan path yang dideklarasikan; tolak path traversal (`..`, absolute di luar scope, symlink escape); baca secret store dilarang kecuali capability khusus + redaksi otomatis di output (token tidak pernah muncul di chat/log island).
- **AI-SEC-004 MUST — Explicit permission for external network actions.** Aksi jaringan keluar (fetch API, kirim notifikasi, buka URL, sinkron layanan) perlu izin eksplisit per-tujuan (allowlist host + tujuan tertulis di prompt konfirmasi); mode tanpa kunci API = tanpa network (launcher/ringkasan lokal tetap berguna). Semua panggilan dicatat (host, waktu, status) dan dapat dicabut per-tujuan. Tanpa exfil clipboard/notifikasi tanpa consent.

Enforcement di arsitektur (`docs/architecture.md`): SEC-001/005 → tabel component boundaries + preload minimal + tanpa plugin loader; SEC-002 → installer/manifest + startup user-level; SEC-003 → `safeStorage`/credential store + klasifikasi secret; SEC-004 → consent UX per provider + allowlist `openExternal` + adapter statis; AI-SEC → AI actor sebagai consumer State Manager (tidak render langsung, hanya emit event tier-terbatas) + tool registry capability-based + audit log. Detail pemetaan menyusul saat AI Layer dirancang (Phase 7); v1 cukup menegakkan SEC-001–005 + `modules.ai=false` berarti tidak ada kode AI yang di-spawn.

## Traceability (requirement → sumber riset)

| Requirement | Sumber utama |
|---|---|
| FR-01–07 (shell) | `research/2026-09-17-dynamic-island-windows.md`, `docs/window-overlay.md`, customization §4 |
| FR-10–16 (pomodoro) | `research/2026-09-17-pomodoro-timer-engine.md` |
| FR-20–27 (signals) | `research/2026-09-17-max-island-system-application-integration.md` |
| FR-30–34 (config) | `research/2026-09-17-customization-system.md` |
| FR-40–43 (state) | `research/2026-09-17-dynamic-island-state-system.md` |
| UI-001–003, SYS-001–004, EXT-001–004 (interfaces) | windows/overlay docs (UI/SYS-002/SYS-004), integration doc (SYS-001/SYS-003/EXT-001–003), P7 spec (EXT-004) |
| STATE-001–003 (state/event, alias of FR-40–42) | state-system doc + `state-machine.md` |
| NFR-PERF-001–003, NFR-MEM-001 (perf) | `research/2026-09-17-performance-max-island.md` (X diisi pasca-benchmark) |
| NFR-REL-001–002 (reliability) | pomodoro doc + customization (atomic write, backup, reconcile) |
| NFR-COMP-001–003 (compat) | `docs/window-overlay.md` §7–9 |
| NFR-UX-001–002 (usability) | state-system (expanded/peek) + overlay (hit-region, focus) |
| NFR-MAINT-001, NFR-OBS-001 | state-system + customization next steps |
| SEC-001–005 (security) | integration (consent/capability) + customization (no plugin v1) + windows doc risiko |
| AI-SEC-001–004 (AI, saat aktif) | state-system (AI sebagai consumer event) + SEC-001–005; enforcement detail di Phase 7 |

## Acceptance checklist (ringkas, detail di doc masing-masing)

- [ ] Freeze renderer 5–10 detik → sisa Pomodoro benar di tick berikutnya (FR-12, NFR-REL-001).
- [ ] Sleep 2 menit di tengah focus → sisa = deadline − now; bila lewat → selesai + flag (FR-12).
- [ ] Kill saat running/paused → relaunch merekonstruksi benar; kill saat tulis settings → tidak korup (FR-13, NFR-REL-002).
- [ ] Play/pause/next Spotify + YouTube Chromium dari island dalam 1 klik (FR-20, NFR-UX-001).
- [ ] Pomodoro jalan + notif GitHub → peek 4 detik → kembali sisa waktu (FR-41–42).
- [ ] Burst track-change tidak rebut slot Pomodoro (FR-21).
- [ ] Collapsed statis 60 detik → CPU < X% (NFR-PERF-001), MEM < X MB (NFR-MEM-001), tanpa repaint kontinu; animasi 60 FPS (NFR-PERF-002); startup < X detik (NFR-PERF-003).
- [ ] Win11 + 100/150/250% scaling + 2 monitor beda DPI + cabut-colok (NFR-COMP-001–003).
- [ ] Config korup / accent invalid / import rusak → fallback + backup + pesan jelas (FR-31, NFR-REL-002).
- [ ] Fullscreen-exclusive game → overlay boleh tertutup, default `hide`; island tidak mencuri fokus / menghalangi kerja (FR-06, NFR-UX-002).
- [ ] Expand/collapse pill termorphosis dengan animasi ≤300 ms, compositor-only (UI-003, NFR-PERF-002).
- [ ] Mic indicator selalu berlabel confidence, tidak pernah klaim status pasti di v1 (SYS-003).
- [ ] AI tanpa key: tidak ada network call, slot tetap berguna sebagai launcher (EXT-004).
- [ ] Instal + jalan penuh tanpa admin; `openExternal` non-allowlist ditolak; token tidak ada di plaintext/`bak`/log (SEC-001–004); `modules.ai=false` → tidak ada kode AI ter-spawn (SEC-005).

(End of file)
