# Functional Requirements — MAX Island (v1)

> Status: Proposed v1. Perluasan detail dari `docs/requirements.md` (ID stabil FR-01…FR-43, NFR-01…NFR-10) dan `docs/product-requirements.md` (§6 Scope).
> Pemetaan: FR-001–FR-007 memperluas FR-01–FR-07 (P1). FR-010–FR-020 memperluas FR-10–FR-16 (P3). FR-030–FR-034 memperluas FR-22/FR-26 + FR-40–FR-43 (P2/P4). FR-040–FR-044 memperluas FR-20–FR-22 (P4). FR-050–FR-057 memperluas FR-30–FR-34 (P5).
> Jika bertentangan, `docs/requirements.md` menang untuk acceptance, `docs/phase-N-*.md` menang untuk urutan kerja.
> Konvensi Priority: **MUST** = wajib v1, **SHOULD** = target v1 bila spike lolos. Dependencies merujuk ID dalam file ini + ID stabil `requirements.md`.

---

## Window (FR-001 – FR-007) — Ref: P1 `phase-1-window-system.md`, `window-overlay.md`

### FR-001
- **Name:** Create floating Island
- **Description:** Membuat satu overlay pill floating yang terasa bagian dari Windows (borderless, transparan, selalu di atas taskbar) tanpa merebut fokus.
- **Trigger:** App ready / user login (startup) / relaunch setelah crash.
- **Input:** Config `position.preset`, `monitor`, `appearance.size`; display target via cursor.
- **Behavior:** Main membuat satu `BrowserWindow` `{frame:false, transparent:true, resizable:false, movable:false, minimizable:false, maximizable:false, fullscreenable:false, skipTaskbar:true, alwaysOnTop:true, level:'pop-up-menu', show:false, backgroundColor:'#00000000', contextIsolation:true, nodeIntegration:false}`; hitung posisi dari `workArea` dalam DIP (`x = workArea.x + (workArea.w - winW)/2`, `y = workArea.y + margin`); tampil via `showInactive` setelah `ready-to-show`. Pill digambar CSS solid/semi-solid + `border-radius` (bukan Acrylic/Mica di v1).
- **Output:** Island state = CREATED + VISIBLE-INACTIVE (tidak fokus), posisi = workArea top-center DIP.
- **Priority:** MUST
- **Dependencies:** — (root; diekspor sebagai `IslandWindowApi` ke semua phase)

### FR-002
- **Name:** Expand Island
- **Description:** Memperbesar pill dari collapsed ke expanded untuk menampilkan kontrol/quick actions.
- **Trigger:** `USER.HOVER` (jika `expandOnHover=true`) / `USER.CLICK` pada pill / alert priority ≥80 (Pomodoro selesai).
- **Input:** Surface saat ini (`dormant/compact/peek`), event `IslandEvent`, config `behavior.expandOnHover`.
- **Behavior:** State Manager (P2) memutuskan expand via reducer `(state, event, now) → state`; WindowManager memanggil `setExpandedSize(w,h)` fixed + reposisi; renderer morph collapsed↔expanded (`transform/opacity` ≤300 ms). Klik saat `peek` membatalkan timeout (cancel-on-exit).
- **Output:** Surface = EXPANDED (owner + animation intent terkirim via `island:sync`).
- **Priority:** MUST
- **Dependencies:** FR-001, FR-034 (restore/timeout contract)

### FR-003
- **Name:** Collapse Island
- **Description:** Mengecilkan kembali expanded ke compact/dormant agar tidak menutupi workflow.
- **Trigger:** `USER.DISMISS` / `USER.LEAVE` + timeout / `SYSTEM.TIMEOUT` 5 dtk idle (kecuali user-pin).
- **Input:** Surface EXPANDED, idle timer, pin flag.
- **Behavior:** Timeout milik State Manager (`endTime = now + ms`, recompute saat resume agar tahan sleep/throttle); `EXPANDED → COMPACT` setelah 5 dtk idle tanpa pointer/keyboard kecuali pin aktif; bila queue kosong + tanpa persistent + `autoHide=true` → `DORMANT`. Media-event tidak boleh menahan island (anti-Windhawk #4738).
- **Output:** Surface = COMPACT (atau DORMANT bila tidak ada sumber aktif).
- **Priority:** MUST
- **Dependencies:** FR-001, FR-002

### FR-004
- **Name:** Move Island
- **Description:** Memindahkan island sesuai preset posisi atau koordinat custom user.
- **Trigger:** User ubah `position.preset` (`top-center|top-left|top-right|custom`) / ganti monitor / event `display-metrics-changed`.
- **Input:** `position.{preset, custom:{x,y}, monitor}` (`primary|cursor|id`).
- **Behavior:** Hitung ulang dari `workArea` display target (`getCursorScreenPoint → getDisplayNearestPoint`); `custom.x/y` di-clamp ke `workArea`; fallback `top-center` primary bila display hilang; subscribe `display-added/removed/display-metrics-changed`. Semua hitungan DIP; `scaleFactor` hanya logging.
- **Output:** Window bounds baru tervalidasi + persist ke `config.json`.
- **Priority:** MUST
- **Dependencies:** FR-001, FR-054

### FR-005
- **Name:** Always-on-top
- **Description:** Island tetap terlihat di atas window biasa dan taskbar tanpa menjadi window fokus.
- **Trigger:** Config `behavior.keepOnTop=true` / boot / perubahan config.
- **Input:** `behavior.keepOnTop`, `workspaceBehavior`.
- **Behavior:** `win.setAlwaysOnTop(true, 'screen-saver')` hanya bila diizinkan perilaku workspace/fullscreen; tidak pernah memanggil `focus()` agresif untuk "memaksa di atas". Level tetap `pop-up-menu` (bukan `screen-saver` permanen yang berisiko tutup UI sistem).
- **Output:** Z-order = ABOVE-TASKBAR, fokus = UNCHANGED (app lain tetap fokus).
- **Priority:** MUST
- **Dependencies:** FR-001, FR-007

### FR-006
- **Name:** Multi-monitor positioning
- **Description:** Island muncul di monitor yang benar dengan skala tajam di semua DPI.
- **Trigger:** Boot / cursor pindah monitor / `display-added/removed` / `display-metrics-changed` / cabut-colok monitor.
- **Input:** `screen.getAllDisplays()`, cursor point, `workArea`, `scaleFactor`.
- **Behavior:** Target display via cursor (bukan hardcode primary); posisi dari `workArea` (bukan `bounds` agar tidak ketutup taskbar); uji 100/125/150/200%+; taskbar atas/bawah/auto-hide. `WM_DPICHANGED`-equivalent ditangani via event display Electron.
- **Output:** Island di display benar + ukuran DIP konsisten + log `scaleFactor`.
- **Priority:** MUST
- **Dependencies:** FR-001, FR-004

### FR-007
- **Name:** Fullscreen behavior
- **Description:** Perilaku island saat app fullscreen (terutama game exclusive) yang aman dan terprediksi.
- **Trigger:** Event fullscreen app lain / user ubah `fullscreenBehavior` (`hide|overlay|minimize`).
- **Input:** `behavior.fullscreenBehavior` (default `hide`).
- **Behavior:** Default `hide` (sembunyikan saat fullscreen); `overlay` hanya best-effort di borderless-windowed (tidak dijamin tembus D3D exclusive); `minimize` menyembunyikan + mengembalikan setelah `leave-full-screen`. Tidak ada janji "tembus fullscreen-exclusive" (bukan bug bila tertutup game).
- **Output:** Island = HIDDEN (atau OVERLAY best-effort) selama fullscreen; kembali setelah exit.
- **Priority:** MUST
- **Dependencies:** FR-001, FR-005

---

## Pomodoro (FR-010 – FR-020) — Ref: P3 `phase-3-pomodoro.md`, riset timer engine

### FR-010
- **Name:** Start (focus session)
- **Description:** Memulai sesi focus dengan durasi configurable dan menampilkan countdown di island.
- **Trigger:** User klik Start / `timer:intent {action:'start'}` dari renderer.
- **Input:** Focus duration (default 25 mnt, clamp 1–180 mnt).
- **Behavior:** Engine (main, satu-satunya sumber kebenaran) set `targetEndEpochMs = Date.now() + durationMs`, `startedAtEpochMs = now`, `status='running'`; emit `POMODORO.STARTED (priority 20, sticky, no timeout)` ke bus P2; persist atomik; mulai tick render 250–500 ms (hanya render, bukan decrement).
- **Output:** Timer state = RUNNING; surface = COMPACT(POMODORO countdown).
- **Priority:** MUST
- **Dependencies:** FR-001; FR-056 (durasi)

### FR-011
- **Name:** Pause
- **Description:** Membekukan sesi berjalan tanpa kehilangan sisa waktu.
- **Trigger:** User klik Pause / `timer:intent {action:'pause'}`.
- **Input:** `targetEndEpochMs` aktif.
- **Behavior:** `remainingOnPauseMs = max(0, targetEnd - Date.now())`; `status='paused'`; `targetEndEpochMs=null`; persist sinkron; hentikan interval render (return idle hemat CPU).
- **Output:** Timer state = PAUSED; countdown berhenti di sisa waktu.
- **Priority:** MUST
- **Dependencies:** FR-010

### FR-012
- **Name:** Resume
- **Description:** Melanjutkan sesi paused dari sisa waktu yang sama.
- **Trigger:** User klik Resume / `timer:intent {action:'resume'}`.
- **Input:** `remainingOnPauseMs`.
- **Behavior:** `targetEndEpochMs = Date.now() + remainingOnPauseMs`; `status='running'`; `remainingOnPauseMs=null`; persist; mulai loop reconcile. Pause berkali-kali aman (selalu hitung ulang dari deadline aktif).
- **Output:** Timer state = RUNNING (sisa sama seperti saat pause).
- **Priority:** MUST
- **Dependencies:** FR-011

### FR-013
- **Name:** Reset
- **Description:** Membatalkan sesi berjalan/paused kembali ke idle.
- **Trigger:** User klik Reset/Discard.
- **Input:** State `running|paused`.
- **Behavior:** `status='idle'`; `targetEnd=null`; `remainingOnPause=null`; persist; catat history `outcome='abandoned'` bila sesi sempat berjalan (idempotent via `phaseRunId`).
- **Output:** Timer state = IDLE; island kembali ke incumbent/queue/dormant.
- **Priority:** MUST
- **Dependencies:** FR-010

### FR-014
- **Name:** Focus session
- **Description:** Fase kerja utama yang memiliki countdown persistent di slot compact.
- **Trigger:** FR-010 / auto-start dari break bila diaktifkan.
- **Input:** `focusMs`, `cycleCount`, `sessionsPerCycle`.
- **Behavior:** Selama running kirim `POMODORO.TICK` 4 Hz (`remainingMs`, tanpa ganti surface — hanya update payload/progress); display `Math.ceil(remaining/1000)`. Selesai (`remaining<=0`) → `completePhase()` + history + toast OS + chime lokal + emit `FINISHED (80, expanded 5 s)`.
- **Output:** Phase = FOCUS-RUNNING → FINISHED; `cycleCount++` saat selesai.
- **Priority:** MUST
- **Dependencies:** FR-010, FR-017, FR-018

### FR-015
- **Name:** Short break
- **Description:** Istirahat pendek antar sesi focus dalam satu siklus.
- **Trigger:** Focus selesai dan `cycleCount % sessionsPerCycle != 0`.
- **Input:** `shortBreakMs` (default 5 mnt), `cycleCount`.
- **Behavior:** Transisi state machine ke `shortBreak`; deadline baru `now + shortBreakMs`; perilaku timer sama seperti focus (deadline + tick + persist + history). Setelah selesai → kembali ke `focus_ready`.
- **Output:** Phase = SHORT-BREAK-RUNNING → FINISHED.
- **Priority:** MUST
- **Dependencies:** FR-014

### FR-016
- **Name:** Long break
- **Description:** Istirahat panjang penutup siklus.
- **Trigger:** Focus selesai dan `cycleCount % sessionsPerCycle == 0`.
- **Input:** `longBreakMs` (default 15 mnt).
- **Behavior:** Transisi ke `longBreak`; setelah selesai `cycleCount=0` (siklus baru). Aturan lain sama dengan FR-015.
- **Output:** Phase = LONG-BREAK-RUNNING → FINISHED; `cycleCount` = 0.
- **Priority:** MUST
- **Dependencies:** FR-014

### FR-017
- **Name:** Automatic transition
- **Description:** Otomatis lanjut ke fase berikutnya tanpa klik, dengan kesempatan batal.
- **Trigger:** Fase selesai dan `autoStartBreaks/autoStartFocus=true`.
- **Input:** `autoStartBreaks`, `autoStartFocus` (default v1 OFF).
- **Behavior:** Default OFF (berhenti di `idle-awaiting-break/focus` + CTA "Mulai break/focus"). Bila ON: countdown-delay 10 dtk + tombol Batal sebelum fase berikutnya `running` (pola Pomatez/Frogodoro). Ganti config saat running berlaku sesi berikutnya (atau tombol eksplisit "Apply + restart").
- **Output:** Phase berikutnya = RUNNING (atau AWAITING-CONFIRM bila OFF).
- **Priority:** SHOULD
- **Dependencies:** FR-014, FR-015, FR-016

### FR-018
- **Name:** Session counter
- **Description:** Menghitung progres siklus (focus ke-berapa) untuk menentukan short vs long berikutnya.
- **Trigger:** Setiap focus selesai / long break selesai.
- **Input:** `cycleCount`, `sessionsPerCycle` (1–12).
- **Behavior:** `cycleCount++` tiap focus selesai; penentu `longBreak` vs `shortBreak`; reset ke 0 setelah long selesai. Statistik harian/streak dihitung dari history (FR-014 tabel `SessionRecord`), bukan dari counter aktif.
- **Output:** `cycleCount` terbaru + indikator "Focus 2/4" di UI.
- **Priority:** MUST
- **Dependencies:** FR-014, FR-015, FR-016

### FR-019
- **Name:** Timer persistence
- **Description:** State timer survive restart renderer/main/crash.
- **Trigger:** Setiap transisi + `visibilitychange:hidden`/`blur` + `suspend/lock-screen` (best-effort <10 ms) + throttle 5 dtk (`lastTick` saja).
- **Input:** `PersistedTimer {phase, status, targetEndEpochMs, remainingOnPauseMs, startedAtEpochMs, cycleCount, configSnapshot, lastTickEpochMs, appVersion}`.
- **Behavior:** Tulis atomik (temp+rename) ke `timer.json` di `userData`; validasi + sanitize saat load (angka positif, batas wajar); korup → `idle` + backup `.bak` + banner. Tidak tulis tiap 250 ms tick render.
- **Output:** File `timer.json` konsisten; boot dapat merekonstruksi (lihat FR-020).
- **Priority:** MUST
- **Dependencies:** FR-010

### FR-020
- **Name:** Sleep/wake recovery
- **Description:** Timer tetap benar setelah sleep/lock/suspend, clock-jump, dan kill proses.
- **Trigger:** `resume` / `unlock-screen` / `visible` / `focus` / tick berikutnya / boot.
- **Input:** `targetEndEpochMs`, `now = Date.now()`, `lastTickEpochMs`, monotonic `performance.now()` (non-persist, sesi hidup saja).
- **Behavior:** Kebijakan default sleep/lock = elapsed (tetap berjalan); `reconcile(): remaining = targetEnd - now`; bila `<=0` → selesaikan fase + flag `completedWhileSuspended` + toast/suara saat bangun; `pauseOnLock=true` diimplementasikan sebagai geser deadline saat unlock (`targetEnd += unlockNow - lockStart`); clock-jump (`|wall−mono| >30 dtk atau >10% durasi`) → hormati wall-clock + flag `clockJumpSuspected`; timezone/DST irrelevant (epoch-ms + ISO UTC). Boot: paused → paused sama; running valid → lanjut/selesaikan tertunda (`recoveredFromCrash`); korup → idle + `.bak`. Jangan andalkan handler `suspend` sempat jalan (Win11 24H2 laptop).
- **Output:** Timer = RECONCILED (lanjut benar / selesai tertunda + flag terlog).
- **Priority:** MUST
- **Dependencies:** FR-019, FR-014

---

## Notification (FR-030 – FR-034) — Ref: P2 `phase-2-state-event.md`, `state-machine.md`, P4

### FR-030
- **Name:** Receive notification
- **Description:** Menerima notifikasi (GitHub/system/app/timer-done) sebagai event ternormalisasi.
- **Trigger:** GitHub listener / system provider / `POMODORO.FINISHED` / `UserNotificationListener` (dengan consent).
- **Input:** Payload mentah (title/body/app/source/timestamp).
- **Behavior:** Provider (main) normalize → `IslandEvent {id, type:'NOTIFY.RECEIVED', category:'notification', priority:60, timeoutMs:4000, timestamp (inject bus), payload, sticky:false}`; dedupe by `id`; drop bila `modules.notification=false`. Izin-ditolak → list kosong diperlakukan sebagai "tidak ada data", bukan error fatal.
- **Output:** Event queued di bus + masuk priority queue.
- **Priority:** MUST
- **Dependencies:** FR-055; FR-032

### FR-031
- **Name:** Display notification
- **Description:** Menampilkan notifikasi sebagai peek sementara tanpa merusak konteks persistent.
- **Trigger:** `NOTIFY.RECEIVED` dengan `priority(60) > current` (mis. Pomodoro 20).
- **Input:** `IslandEvent` notification, surface saat ini.
- **Behavior:** Preempt + push surface lama ke history stack (max ~5); render `Peek(GitHub PR #123)` + start timeout 4000 ms; `USER.CLICK` saat peek → cancel timeout → `Expanded` + pin (max 30 dtk paksa yield). Latest-wins + coalesce bila se-jenis (tidak antre memanjang).
- **Output:** Surface = PEEK(notification) selama `timeoutMs`.
- **Priority:** MUST
- **Dependencies:** FR-030, FR-032, FR-033

### FR-032
- **Name:** Notification priority
- **Description:** Menentukan siapa menang saat event bersamaan secara deterministik.
- **Trigger:** Setiap event masuk (termasuk burst Pomodoro + track-change + notif dalam 1 dtk).
- **Input:** `incoming.priority` vs `current.priority`; tabel awal 100 critical pinned / 80 urgent 5 s / 60 transient 4 s / 40 media-event 3–5 s / 20 persistent sticky / 0 idle.
- **Behavior:** `>` → preempt + save history; `==` → FIFO (incumbent menang, anti-flicker); `<` → queue sort `(priority desc, timestamp asc)`, cap ~20, overflow collapse (`+N lainnya`). Media saat Pomodoro aktif → secondary bubble/queue, bukan rebut slot utama.
- **Output:** Keputusan tampil deterministik + queue ter-sort.
- **Priority:** MUST
- **Dependencies:** FR-030 (kontrak `state-machine.md` §3)

### FR-033
- **Name:** Notification timeout
- **Description:** Setiap tampil sementara wajib hilang otomatis via timeout milik manager.
- **Trigger:** Entry ke `Peek`/alert; `SYSTEM.TIMEOUT` saat `endTime` tiba.
- **Input:** `timeoutMs` (default transient 4000; media 3000–5000; urgent 5000; critical `null`=pinned).
- **Behavior:** `Timeout Registry`: `start(id, endTime=now+ms)` on entry, `cancel(id)` on exit; hover/focus pause (simpan remaining), leave resume (recompute `endTime`); tick/throttle tidak me-reset timer secara diam-diam.
- **Output:** `SYSTEM.TIMEOUT` → restore/drain (lihat FR-034).
- **Priority:** MUST
- **Dependencies:** FR-031

### FR-034
- **Name:** Restore previous Island state
- **Description:** Setelah notifikasi hilang, kembali persis ke konteks sebelumnya (bukan restart).
- **Trigger:** `SYSTEM.TIMEOUT` / `USER.DISMISS` / `NOTIFY.DISMISSED`.
- **Input:** History stack top, queue head.
- **Behavior:** Pop `history.top`; validasi masih valid (mis. Pomodoro belum selesai saat notif tampil) → tampilkan kembali dengan sisa waktu berjalan (`Compact(Pomodoro 24:55)`, bukan 25:00); bila basi → fallback queue-head → fallback `Dormant`. Contoh: Pomodoro → GitHub 4 dtk → Pomodoro lanjut.
- **Output:** Surface = previous valid state (atau queue/dormant).
- **Priority:** MUST
- **Dependencies:** FR-033, FR-014

---

## Media (FR-040 – FR-044) — Ref: P4 `phase-4-system-integration.md` (GSMTC generik)

### FR-040
- **Name:** Detect media playback
- **Description:** Mendeteksi playback dari SEMUA app GSMTC (Spotify, Chrome/Edge YouTube, local player) tanpa API key.
- **Trigger:** `CurrentSessionChanged` / polling 500–1000 ms / app media dibuka/ditutup.
- **Input:** Sesi `GlobalSystemMediaTransportControlsSessionManager` (bukan SMTC-only).
- **Behavior:** Provider `gsmtc` (main, via `windows-media-sessions` native helper) subscribe event + poll lambat; emit `MEDIA.TRACK_CHANGED/PLAY_PAUSE/STOPPED`; sesi hilang (app tutup) → `MEDIA.STOPPED` → drain queue. Tanpa kredensial/izin khusus.
- **Output:** Media session Terdeteksi/Hilang + event ke bus.
- **Priority:** MUST
- **Dependencies:** FR-001; FR-055

### FR-041
- **Name:** Show current track
- **Description:** Menampilkan judul/artis/artwork/progress track aktif sekilas.
- **Trigger:** `MEDIA.TRACK_CHANGED` / `PLAY_PAUSE`.
- **Input:** `payload {title, artist, artwork, timeline, status}`.
- **Behavior:** Event `priority:40, timeoutMs:3000–5000, sticky:false`; bila island idle/media → tampil `Peek/Compact(MEDIA)`; bila Pomodoro persistent aktif → jangan rebut slot utama (secondary bubble/queue). Tick timeline media hanya update progress bar, bukan event resolver (anti-flicker).
- **Output:** Surface = PEEK/COMPACT(media info) 3–5 dtk.
- **Priority:** MUST
- **Dependencies:** FR-040, FR-032

### FR-042
- **Name:** Play/pause
- **Description:** Mengontrol play/pause app yang sedang memutar dari island.
- **Trigger:** User klik play/pause di expanded island / `MEDIA` intent.
- **Input:** Sesi GSMTC aktif (`TryTogglePlayPauseAsync`).
- **Behavior:** Main memanggil kontrol GSMTC generik (tanpa API per-app); kirim `island:sync` update status; gagal (sesi hilang) → `MEDIA.STOPPED` + fallback dormant/compact. Tidak memakai SMTC-only untuk kontrol app lain.
- **Output:** Playback = TOGGLED; UI sinkron playing/paused.
- **Priority:** MUST
- **Dependencies:** FR-040

### FR-043
- **Name:** Previous/next
- **Description:** Pindah track sebelumnya/berikutnya dari island.
- **Trigger:** User klik prev/next.
- **Input:** Sesi GSMTC aktif (`TrySkipNext/PreviousAsync`).
- **Behavior:** Sama seperti FR-042; `TRACK_CHANGED` berikutnya ditampilkan transient (FR-041). Rate-limit klik agar tidak burst event.
- **Output:** Track = SKIPPED; notif track baru tampil 3–5 dtk.
- **Priority:** MUST
- **Dependencies:** FR-040

### FR-044
- **Name:** Media state synchronization
- **Description:** Status island selalu sama dengan status player asli (playing/paused/stopped).
- **Trigger:** Event GSMTC / `MEDIA.PROGRESS` throttle 1 dtk / `SESSION_LOST`.
- **Input:** `playbackStatus`, timeline position.
- **Behavior:** `PLAYING/PAUSED` update payload tanpa ganti surface (tick-only); `STOPPED/SESSION_LOST` → hapus sumber media dari active set → recompute incumbent (kembali ke Pomodoro/queue/dormant). Burst track-change berurutan di-debounce 100–200 ms sebelum `island:sync` agar tidak flicker.
- **Output:** Island media state = SYNCED dengan OS.
- **Priority:** MUST
- **Dependencies:** FR-041, FR-032

---

## Customization (FR-050 – FR-057) — Ref: P5 `phase-5-customization.md`, riset customization

### FR-050
- **Name:** Change theme
- **Description:** Ganti tema terang/gelap/ikut-sistem dan diterapkan instan.
- **Trigger:** User pilih `appearance.theme` (`system|light|dark`) di Settings.
- **Input:** `theme` enum.
- **Behavior:** Validasi ajv; `nativeTheme.themeSource = value` (default `system`); `[data-theme]` ikut `shouldUseDarkColors`; dengar `nativeTheme.updated` untuk ikut perubahan OS otomatis; broadcast `config:changed`; tanpa reload.
- **Output:** Theme APPLIED instan + persist `config.json`.
- **Priority:** MUST
- **Dependencies:** FR-001

### FR-051
- **Name:** Change accent
- **Description:** Ganti warna aksen island (CTA, progress, highlight).
- **Trigger:** User pilih warna di picker/input hex.
- **Input:** `accent` string hex `#rrggbb`.
- **Behavior:** Validasi pattern `^#[0-9a-fA-F]{6}$` (contoh user `"merah"`/`#fff` ditolak fatal dengan semua error terkumpul); apply via CSS var `--accent`; preview instan debounce 100 ms; tulis debounce 100–200 ms.
- **Output:** Accent APPLIED + persist.
- **Priority:** MUST
- **Dependencies:** FR-050

### FR-052
- **Name:** Change transparency
- **Description:** Mengatur opasitas pill agar menyatu dengan wallpaper/workflow.
- **Trigger:** User geser slider transparency.
- **Input:** `transparency` 0.4–1.0.
- **Behavior:** Clamp 0.4–1.0 (di luar itu ditolak/strip); apply `--island-opacity`; `blur` flag forward-compatible default `false` (blur real out-of-scope v1, fallback opacity). Sediakan "Reset appearance" satu klik bila tidak terbaca (RDP/VM).
- **Output:** Opacity APPLIED + persist (debounced).
- **Priority:** MUST
- **Dependencies:** FR-050

### FR-053
- **Name:** Change size
- **Description:** Mengatur ukuran pill (preset atau custom) dengan rounding yang konsisten.
- **Trigger:** User pilih `size` (`compact|comfortable|large|custom`) + `customSize`/`radius`.
- **Input:** `size`, `customSize{w,h}`, `radius` 8–32.
- **Behavior:** Validasi enum + range; `setSize` fixed collapsed/expanded + reposisi workArea; rounding via CSS `--island-radius` (DWM rounding tidak dijamin untuk frameless+transparent); animasi morph tetap `transform/opacity`.
- **Output:** Size APPLIED + persist.
- **Priority:** MUST
- **Dependencies:** FR-001, FR-004

### FR-054
- **Name:** Change position
- **Description:** Memindahkan island ke preset atau koordinat custom (lihat FR-004 untuk perilaku window).
- **Trigger:** User pilih `position.preset` / drag ke custom / ganti monitor.
- **Input:** `position.{preset, custom:{x,y}, monitor}`.
- **Behavior:** Sama dengan FR-004 + persist profil aktif; custom di-clamp workArea; fallback top-center bila display hilang.
- **Output:** Position APPLIED + persist.
- **Priority:** MUST
- **Dependencies:** FR-004

### FR-055
- **Name:** Enable/disable modules
- **Description:** Menyalakan/mematikan modul fungsional (Pomodoro/Music/Notification/Download/Microphone/AI).
- **Trigger:** User toggle `modules.{pomodoro,music,notification,download,microphone,ai}` boolean.
- **Input:** 6 boolean (required).
- **Behavior:** `false` = actor tidak di-spawn + event kategorinya di-drop di bus + tidak masuk queue (kontrak anti-#4738 dengan P2); `true` = spawn + subscribe. Berlaku instan via `config:changed` tanpa restart. Bukan plugin-system (tanpa load kode pihak-ketiga di v1).
- **Output:** Module ENABLED/DISABLED + island tidak lagi menampilkan kategori mati.
- **Priority:** MUST
- **Dependencies:** FR-030, FR-040, FR-010

### FR-056
- **Name:** Configure Pomodoro duration
- **Description:** Mengatur durasi focus/short/long, sesi per siklus, dan auto-start.
- **Trigger:** User ubah angka di Settings.
- **Input:** `focusMs/shortBreakMs/longBreakMs` (clamp 1–180 mnt), `sessionsPerCycle` 1–12, `autoStartBreaks/Focus`, `soundEnabled/volume`.
- **Behavior:** `sanitizeConfig` di `src/shared` (dipakai main + renderer); perubahan saat running berlaku sesi berikutnya (atau tombol eksplisit restart sesi); persist + kirim `configSnapshot` ke TimerEngine.
- **Output:** Config Pomodoro APPLIED (berlaku sesi berikutnya).
- **Priority:** MUST
- **Dependencies:** FR-010, FR-017, FR-019

### FR-057
- **Name:** Configure animation
- **Description:** Mengatur gaya animasi morph island.
- **Trigger:** User pilih `animation` (`spring|fade|none`).
- **Input:** `animation` enum.
- **Behavior:** Validasi enum; apply `--island-anim`; `spring`/`fade` ≤300 ms compositor-only; `none` untuk reduced-motion/test; dikirim sebagai animation intent via `island:sync`.
- **Output:** Animation APPLIED + persist.
- **Priority:** SHOULD
- **Dependencies:** FR-002, FR-003

---

## Traceability (ringkas)

| FR file ini | ID stabil `requirements.md` | Phase |
|---|---|---|
| FR-001–FR-007 | FR-01–FR-07 | P1 |
| FR-010–FR-020 | FR-10–FR-16 | P3 |
| FR-030–FR-034 | FR-22, FR-26, FR-40–FR-43 | P2+P4 |
| FR-040–FR-044 | FR-20–FR-22 | P4 |
| FR-050–FR-057 | FR-30–FR-34 | P5 |

Contoh yang diminta: FR-001 Pomodoro Timer dipecah menjadi FR-010 (Trigger: user starts focus session; Input: 25 mnt; Behavior: start deadline + tampilkan sisa; Output: RUNNING) agar setiap transisi (pause/resume/reset/persist/recovery) dapat di-acceptance terpisah.

(End of file)
