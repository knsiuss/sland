# ADR-005: Plugin architecture (static adapters, no dynamic loading in v1)

- **Tanggal:** 2026-09-17
- **Status:** Proposed

## Context

Target integrasi banyak (Spotify, Chrome, Edge, VS Code, Discord, GitHub, Explorer). Integrasi brutal satu-satu tidak scalable; tapi plugin dinamis (load kode pihak ketiga saat runtime) membuka risiko keamanan (code execution) + kompleksitas versioning/sandboxing. Evidence sinyal: `research/2026-09-17-max-island-system-application-integration.md`.

## Decision

v1 = **adapter statis** yang di-review dan di-bundle bersama app, dengan interface tunggal:

```
{ id, match(appId | session) → bool, map(raw) → MediaState|SystemState|AppPresence, commands[] }
```

Provider generik didahulukan (satu GSMTC provider menggantikan Spotify/Browser adapter spesifik; satu foreground provider + allowlist menggantikan adapter per-app). Tidak ada `require()`/`import()` dinamis dari folder user di v1.

## Consequences

- Permukaan serangan minimal: tidak ada eksekusi kode pihak ketiga saat runtime.
- Menambah integrasi = tambah file adapter + daftar di registry statis + review — sengaja dibuat sedikit friksi agar kualitas terjaga.
- Batasan sadar: user tidak bisa pasang plugin sendiri di v1. Plugin dinamis (sandbox + signing + permission per-plugin) adalah ADR lanjutan, dibuka hanya bila ada 3+ adapter yang polanya terbukti berulang (prinsip: jangan abstraksi sebelum pola muncul 3x).

## Alternatives considered

- **Adapter per-app brutal (tanpa interface):** ditolak — duplikasi logika GSMTC/foreground di tiap adapter.
- **Plugin dinamis sejak awal (folder plugins + runtime load):** ditolak untuk v1 — risiko eksekusi kode + versioning tanpa manfaat yang terbukti; YAGNI.
- **Semua di core tanpa adapter:** ditolak — core menggembung; batas `match/map/commands` memaksa event ternormalisasi (lihat ADR-003).
