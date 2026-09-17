# ADR-007: Module failures must not crash core

- **Tanggal:** 2026-09-17
- **Status:** Proposed

## Context

MAX Island adalah overlay yang selalu tampil dengan banyak provider eksternal (GSMTC media, notification listener, foreground detection, config store). Setiap provider bisa gagal kapan saja: backend hilang, sesi media lenyap, izin OS dicabut di tengah jalan, file settings korup, display berubah saat expand, bahkan renderer crash. Tanpa aturan isolasi, satu modul mati ikut mematikan seluruh island — kegagalan yang paling merusak kepercayaan untuk app yang "selalu ada".

Aturan yang sudah normatif dan disalin verbatim ke sini (tanpa persyaratan baru):

- ERR-004 (v1): "Integrasi eksternal yang gagal tidak boleh crash main process (isolasi try/catch per provider + backend di-respawn dengan backoff)."
- SEC-005 (v1): Modules = boolean feature-flags, bukan load kode pihak-ketiga; kontrak event berversi agar yang pecah ditolak load + pesan, bukan crash host.
- Architecture: "Renderer crash → main tetap jalan + notif OS tetap muncul; relaunch re-sync."

## Decision

Kegagalan satu modul tidak boleh crash core: setiap provider diisolasi (try/catch per provider + respawn backoff), renderer crash tidak menjatuhkan main process, dan config korup jatuh ke `.bak` + defaults + banner.

## Consequences

- Positif: island tetap hidup saat media/listener/config/display bermasalah; tiap kegagalan punya respons mekanis (slot idle, degradasi + indikator jujur, fallback defaults, re-layout, re-sync).
- Negatif yang diterima: perlu disiplin try/catch per provider + respawn backoff + ring-buffer log `{provider, error, at}` agar kegagalan senyap tidak menumpuk tanpa terlihat.
- Sengaja TIDAK dilakukan: me-restart seluruh app untuk memulihkan satu provider; men-crash dengan sengaja agar "fail fast".

## Alternatives considered

- **Fail fast (satu modul gagal → crash semua):** ditolak — menghancurkan kepercayaan untuk overlay always-on-top; bertentangan dengan ERR-001/002/003/005/006.
- **Silent swallow tanpa log/indikator:** ditolak — kegagalan tak terlihat menumpuk; wajib log terbatas + indikator jujur di UI.
- **Satu try/catch global di main:** ditolak — terlalu kasar; isolasi harus per provider agar yang sehat tetap jalan.
