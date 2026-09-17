# Decision Document — MAX Island: Windows System Integration + Application Integration

- **Tanggal:** 2026-09-17
- **Topik:** (a) Dari 13 sinyal sistem Windows mana yang feasible via API publik vs heuristik vs ditunda; (b) apakah integration layer perlu adapter per-app atau satu lapisan generik
- **Status:** Proposed (riset API, belum ada prototipe/spike lokal)
- **Scope:** MAX Island v1 di Windows, asumsi Electron, Win10 1809+ / Win11
- **Out-of-scope:** Pilihan framework final, desain visual, OAuth detail per layanan, implementasi native module

## Executive Summary

Bangun **MAX Core tipis event-normalized** (`MediaState` / `SystemState` / `AppPresence`) di atas **3 provider generik** — bukan adapter per-app satu-satu: (1) **GSMTC provider** untuk SEMUA media (gantikan Spotify/Browser Adapter spesifik), (2) **foreground+process provider** (`GetForegroundWindow` + allowlist) + URI launcher untuk aksi, (3) **power/network/FS-watcher + `UserNotificationListener`** (dengan consent UX) untuk sistem. Contoh aliran aman: `Spotify playing -> GSMTC session -> MAX Island "Blinding Lights"` feasible v1 **tanpa API key**. Sebaliknya `Microphone active -> MIC ACTIVE` **tidak feasible** sebagai sinyal pasti v1 — jadikan heuristik berlabel confidence. Tunda: mic-state pasti, Wi-Fi scan/BSSID, brightness monitor eksternal, Discord voice-state, GitHub live, plugin loading dinamis.

## Konteks

MAX Island akan jauh lebih menarik kalau bukan cuma Pomodoro. Target sinyal: Media, Volume, Microphone, Battery, Bluetooth, Wi-Fi, Downloads, Notifications, Clipboard, Calendar, Focus Sessions, Screen, Window/Application. Target app awal: Spotify, Chrome, Edge, VS Code, Discord, GitHub, Windows Explorer. Pertanyaan: integration satu-satu secara brutal, atau lapisan generik + adapter?

## Findings — System Integration (13 sinyal)

### 1. Media — FEASIBLE v1, tanpa API key

**[Fakta]** `GlobalSystemMediaTransportControlsSessionManager.RequestAsync() -> GetCurrentSession()/GetSessions()` + `Try*Async` + event `MediaPropertiesChanged/PlaybackInfoChanged/CurrentSessionChanged` adalah API untuk baca/kontrol app lain; butuh capability `globalMediaControl`. `SystemMediaTransportControls` saja hanya untuk publish playback sendiri.

Aliran v1: `Spotify playing -> GSMTC session -> MAX Island "Blinding Lights"`. Berlaku untuk SEMUA app yang mendaftar ke GSMTC (Spotify, Chrome, Edge) — satu provider, tanpa integrasi per-app.

### 2. Volume — FEASIBLE, tapi butuh Win32 native

**[Fakta]** Master volume adalah Win32 Core Audio `IAudioEndpointVolume` via `IMMDevice::Activate` (EndpointVolume API), bukan WinRT sederhana; per-session via `ISimpleAudioVolume`. Tidak ada one-liner Electron/WinRT.

Implikasi: kontrol volume butuh helper native kecil (bukan sekadar wrapper WinRT). Detail: `IAudioEndpointVolume` — https://learn.microsoft.com/en-us/windows/win32/api/endpointvolume/nn-endpointvolume-iaudioendpointvolume

### 3. Microphone — TIDAK FEASIBLE sebagai sinyal pasti v1

**[Fakta]** Windows menampilkan indikator mic di taskbar dan halaman privacy `Let desktop apps access your microphone`, tetapi **tidak ada WinRT boolean publik "mic sedang aktif"** untuk pihak ketiga; dokumen privacy menyatakan desktop app bisa tidak tercatat / tetap mengakses di luar setting. ([Windows camera/microphone and privacy](https://support.microsoft.com/en-us/windows/windows-camera-microphone-and-privacy-a83257bc-e990-d54a-d212-b5e41beba857))

**[Inferensi]** `MIC ACTIVE` tidak bisa dijanjikan via satu API publik; kandidat hanya proxy: enumerasi sesi capture WASAPI (`IAudioSessionEnumerator`/`IAudioSessionControl2`, lihat [About WASAPI](https://learn.microsoft.com/en-us/windows/win32/coreaudio/wasapi)) via helper native, atau heuristik process-detection (Teams/Discord/Chrome foreground). Perlu spike validasi. Di v1 jadikan **heuristik berlabel confidence, bukan status sistem**.

### 4. Battery — FEASIBLE, risiko rendah

**[Fakta]** Pola resmi `Battery.AggregateBattery.GetReport()` -> `BatteryReport` + event `ReportUpdated`, atau `Windows.System.Power.PowerManager`; fallback Win32 sederhana `GetSystemPowerStatus`. ([Get battery information](https://learn.microsoft.com/en-us/windows/apps/develop/devices-sensors/get-battery-info))

### 5. Bluetooth / Wi-Fi — status FEASIBLE, scan detail TERBATAS

**[Fakta]** `Windows.Devices.Bluetooth` + `Windows.Devices.Radios` untuk status radio/adapter; `Windows.Networking.Connectivity.NetworkInformation.GetInternetConnectionProfile() + NetworkStatusChanged` untuk online/offline **tanpa izin khusus**. ([NetworkInformation](https://learn.microsoft.com/en-us/uwp/api/windows.networking.connectivity.networkinformation?view=winrt-28000)) Scan Wi-Fi detail (`WiFiAdapter.ScanAsync`) butuh capability `wiFiControl` + location consent untuk BSSID. ([WiFiAdapter](https://learn.microsoft.com/en-us/uwp/api/windows.devices.wifi.wifiadapter?view=winrt-28000))

Keputusan: status radio + online/offline v1; SSID/BSSID detail ditunda (butuh consent lokasi).

### 6. Notifications (baca) — FEASIBLE dengan consent UX

**[Fakta]** `UserNotificationListener.Current + RequestAccessAsync (harus UI-thread) + GetNotificationsAsync(Toast) + NotificationChanged`, butuh izin eksplisit; jika dicabut API gagal diam-diam (return list kosong). Kirim notif sendiri via Toast/AppNotifications terpisah. ([Notification listener](https://learn.microsoft.com/en-us/windows/apps/develop/notifications/app-notifications/notification-listener), [UserNotificationListener](https://learn.microsoft.com/en-us/uwp/api/windows.ui.notifications.management.usernotificationlistener?view=winrt-28000))

Keputusan: mirror notifikasi hanya dengan UX consent eksplisit; desain untuk kondisi izin-ditolak (list kosong ≠ tidak ada notif).

### 7. Clipboard — item saat ini saja, histori TIDAK

**[Fakta]** Electron `clipboard.readText/readImage/readHTML` (main process, via contextBridge) hanya item saat ini. ([Electron clipboard](https://www.electronjs.org/docs/latest/api/clipboard)) Histori Win+V dibatasi 25 entri / 4MB per item / hilang saat restart kecuali pinned, dan **tidak ada API publik** untuk baca seluruh histori. ([Using the clipboard](https://support.microsoft.com/en-us/windows/using-the-clipboard-30375039-ce71-9fe4-5b30-21b7aab6b13f))

### 8. Calendar — butuh consent layanan, tidak gratis

**[Fakta]** Ada `Windows.ApplicationModel.Appointments/AppointmentStore.requestAccessAsync`, tetapi data riil praktisnya via Graph/Outlook dengan consent; tidak gratis tanpa izin.

Keputusan: v1 cukup deep-link kalender; sync agenda = fase lanjutan (butuh OAuth + consent).

### 9. Focus Sessions — deteksi YA, paksa TIDAK

**[Fakta]** `FocusSessionManager.IsSupported + IsFocusActive + IsFocusActiveChanged` didukung untuk deteksi/reaksi; tetapi `TryStartFocusSession` adalah **Limited Access Feature** (butuh LAF unlock token). Jadi island tidak bisa memaksa Focus OS di v1. ([Detect and react to focus session state](https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/applifecycle/focus-session), [FocusSession LAF](https://learn.microsoft.com/en-us/uwp/api/windows.ui.shell.focussession?view=winrt-28000))

Keputusan: island boleh *bereaksi* ke Focus OS aktif, tapi Pomodoro internal tetap state-machine lokal (tidak bergantung OS).

### 10. Screen brightness — panel laptop saja

**[Fakta]** `WmiMonitorBrightnessMethods.WmiSetBrightness` / `WmiMonitorBrightness` (`root\wmi`) hanya untuk panel internal laptop; monitor eksternal butuh DDC/CI dan sering no-op. ([WmiSetBrightness](https://learn.microsoft.com/en-us/windows/win32/wmicoreprov/wmisetbrightness-method-in-class-wmimonitorbrightnessmethods))

Keputusan: brightness eksternal ditunda.

### 11. Window/Application foreground — FEASIBLE via Win32

**[Fakta]** `GetForegroundWindow + GetWindowThreadProcessId` dan `EnumWindows` (User32, desktop apps saja di Win8+) adalah cara resmi; tidak butuh izin khusus tetapi perlu polling/event (`SetWinEventHook`) dan wrapper native (`active-win`/`get-windows`) untuk judul/pemilik proses. ([GetForegroundWindow](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getforegroundwindow), [EnumWindows](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumwindows))

Ini fondasi `AppPresence`: deteksi VS Code / Chrome / Discord / Explorer foreground via allowlist exe.

### 12. Downloads — tidak ada download-manager OS global

**[Fakta]** Tidak ada OS download-manager global; BITS hanya untuk job milik sendiri. Cara benar: file watcher (chokidar) pada folder Downloads + `shell:Downloads`/Explorer URI. Download browser tanpa extension/native-messaging tidak terbaca.

### 13. Discord voice-state — TIDAK tersedia lokal

**[Fakta]** Game SDK diarsipkan; panduan resmi mengarahkan ke Social SDK untuk Rich Presence baru (rate limit `UpdateActivity` 5/20 dtk). ([Using Rich Presence with Game SDK — archived](https://docs.discord.com/developers/rich-presence/using-with-the-game-sdk), [Rich Presence](https://docs.discord.com/developers/platform/rich-presence)) Tidak ada API lokal publik untuk membaca voice-state Discord ke island.

## Findings — Application Integration (jangan brutal per-app)

**[Opini sumber/sekunder]** Pola `vscode://file/...`, `vscode:extension/...`, `spotify:`/`discord://` URI schemes beredar di StackOverflow/dok komunitas; dapat dipakai untuk **aksi launch, bukan observasi state**. Verifikasi per-skema perlu uji lokal karena dokumentasi tersebar.

**[Inferensi]** Arsitektur yang benar: **MAX Core tipis event-normalized** + adapter statis, bukan integrasi brutal satu-satu:

```
MAX Core (MediaState / SystemState / AppPresence)
  │
  ├── GSMTC provider  → SEMUA media (gantikan Spotify/Browser Adapter)
  ├── Foreground provider (allowlist: Code.exe, chrome.exe,
  │   msedge.exe, discord.exe, explorer.exe) + URI launcher
  └── Power/Network/FS-watcher + NotificationListener
```

Interface adapter: `{ id, match(appId/session), map(), commands[] }` + allowlist. **Tanpa plugin loading dinamis di v1** (risiko keamanan + kompleksitas; ganti dengan adapter statis yang di-review).

## Recommendation

1. **3 provider generik dulu**, bukan 7 adapter spesifik:
   - GSMTC provider → semua media.
   - Foreground+process provider + `shell.openExternal` URI launcher → aksi per-app.
   - Power/Network/FS-watcher + `UserNotificationListener` (consent UX) → sistem.
2. **Tunda v1:** mic-state pasti, Wi-Fi scan/BSSID, brightness eksternal, Discord voice-state, GitHub live (cukup deep-link + polling REST bila ada token), plugin dinamis.
3. **Spike wajib sebelum build:** GSMTC play/pause Spotify+YouTube; foreground detect VSCode/Chrome; toast-listen dengan izin ditolak/diizinkan.

## Matriks sinyal v1 vs deferred

| Sinyal | v1 | Catatan |
|---|---|---|
| Media (semua app) | ✅ GSMTC | Tanpa API key |
| Foreground app + URI launch | ✅ Win32 + allowlist | Tanpa state internal app |
| Battery / online-offline | ✅ WinRT ringan | Risiko rendah |
| Notifikasi (baca) | ✅ bersyarat | Butuh consent; gagal diam-diam bila dicabut |
| Clipboard item saat ini | ✅ Electron API | Histori Win+V tidak terbaca |
| Volume | ⚠️ fase 2 | Butuh helper native Core Audio |
| Mic aktif pasti | ❌ tunda | Heuristik ber-confidence saja |
| Wi-Fi detail / BSSID | ❌ tunda | Butuh location consent |
| Calendar sync | ❌ tunda | Butuh OAuth/Graph |
| Focus OS (paksa mulai) | ❌ tunda | LAF token; deteksi saja boleh |
| Brightness eksternal | ❌ tunda | DDC/CI sering no-op |
| Discord voice-state | ❌ tunda | Tidak ada API lokal publik |
| GitHub live | ❌ tunda | Deep-link + REST bila ada token |
| Downloads browser | ❌ tunda | FS-watcher folder saja |

## Assumptions & Limitations

- Asumsi Electron + Win10 1809+/Win11 + akses WinRT via wrapper (`windows-media-sessions`/`@nodert`) + tanpa constraint Store/admin.
- Belum diverifikasi lokal (tidak ada prototipe/native build di sesi ini).
- Perilaku capability/consent dapat berubah per build Windows.
- Temuan mic/Bluetooth/brightness adalah inferensi berisiko dan butuh spike.

## Sources

- GlobalSystemMediaTransportControlsSessionManager — https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssessionmanager?view=winrt-28000
- Manual control of the SMTC — https://learn.microsoft.com/en-us/windows/apps/develop/media-playback/system-media-transport-controls
- Notification listener — https://learn.microsoft.com/en-us/windows/apps/develop/notifications/app-notifications/notification-listener
- UserNotificationListener Class — https://learn.microsoft.com/en-us/uwp/api/windows.ui.notifications.management.usernotificationlistener?view=winrt-28000
- Get battery information — https://learn.microsoft.com/en-us/windows/apps/develop/devices-sensors/get-battery-info
- Detect and react to focus session state — https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/applifecycle/focus-session
- FocusSession Class (LAF) — https://learn.microsoft.com/en-us/uwp/api/windows.ui.shell.focussession?view=winrt-28000
- IAudioEndpointVolume — https://learn.microsoft.com/en-us/windows/win32/api/endpointvolume/nn-endpointvolume-iaudioendpointvolume
- About WASAPI — https://learn.microsoft.com/en-us/windows/win32/coreaudio/wasapi
- Windows camera/microphone and privacy — https://support.microsoft.com/en-us/windows/windows-camera-microphone-and-privacy-a83257bc-e990-d54a-d212-b5e41beba857
- WiFiAdapter Class — https://learn.microsoft.com/en-us/uwp/api/windows.devices.wifi.wifiadapter?view=winrt-28000
- NetworkInformation Class — https://learn.microsoft.com/en-us/uwp/api/windows.networking.connectivity.networkinformation?view=winrt-28000
- Electron clipboard — https://www.electronjs.org/docs/latest/api/clipboard
- Using the clipboard (history limits) — https://support.microsoft.com/en-us/windows/using-the-clipboard-30375039-ce71-9fe4-5b30-21b7aab6b13f
- WmiSetBrightness — https://learn.microsoft.com/en-us/windows/win32/wmicoreprov/wmisetbrightness-method-in-class-wmimonitorbrightnessmethods
- GetForegroundWindow — https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getforegroundwindow
- EnumWindows — https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumwindows
- Using Rich Presence with the Game SDK (archived) — https://docs.discord.com/developers/rich-presence/using-with-the-game-sdk
- Rich Presence — https://docs.discord.com/developers/platform/rich-presence

## Blocker

None untuk riset. Keputusan produk yang dibutuhkan builder: subset sinyal v1 vs deferred + setujui UX consent untuk notification listener (dan lokasi bila perlu SSID) — tanpa ini jangan janjikan mirror notifikasi/Wi-Fi detail di v1.
