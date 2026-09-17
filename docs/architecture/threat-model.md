# Threat Model (v1 + AI)

> Pemetaan ancaman → mitigasi → ID. Bukan audit formal — cukup untuk review tiap PR yang menyentuh boundary.

## Aset

 Island tampil selalu (kepercayaan user), `config.json`/timer/history lokal, secret masa depan (token integrasi), konten notifikasi/clipboard, izin OS (listener/location), installer + update.

## Ancaman → mitigasi

| Ancaman | Mitigasi | ID |
|---|---|---|
| Renderer escape ke Node/fs | `contextIsolation:true`, `nodeIntegration:false`, preload minimal, tanpa `require` dinamis | SEC-001, TC-SEC-001 |
| Instalasi/privilege escalation | User-level saja, tanpa admin/UAC, startup via `setLoginItemSettings` | SEC-002 |
| Secret bocor (log/`bak`/repo) | Klasifikasi + `safeStorage`/DPAPI, redaksi diagnostics, grep audit | SEC-003 |
| Integrasi liar / exfil tanpa consent | Opt-in per provider, allowlist `openExternal`, adapter statis, cabut = degradasi jujur | SEC-004 |
| Plugin/kode pihak ketiga | v1 = flags, bukan loader; v2+ default-deny + capability + RFC | SEC-005 |
| AI bertindak tanpa izin | Tier 0–3, default read-only + saran; privileged = konfirmasi tiap kali | AI-SEC-001 |
| AI tool terlalu kuat | Capability-based registry, schema + rate limit + audit log | AI-SEC-002 |
| AI baca file sembarang | Scope `%APPDATA%\<App>` + path terdaftar, tolak traversal/symlink escape | AI-SEC-003 |
| AI kirim data keluar | Allowlist host + konfirmasi per-tujuan; no-key = no-network | AI-SEC-004 |
| Supply chain (dependency jahat) | Pin versi + `npm ci` + review dependency baru (aturan AGENTS.md §4) | SEC-001 |

## Yang sengaja tidak ditangani v1

Sandbox OS-level (AppContainer), code signing EV + reputasi SmartScreen, E2E encryption sync (tanpa cloud), anti-tamper. Dicatat agar tidak diklaim — masuk roadmap bila dibutuhkan.
