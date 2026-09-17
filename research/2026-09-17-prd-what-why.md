# Decision Document — PRD: What Are We Building and Why (MAX Island v0.1)

- **Tanggal:** 2026-09-17
- **Topik:** PRD — Problem, Users, Goals, User Stories, Core Features, Non-goals, Success Metrics, Constraints, MVP
- **Status:** Proposed (mengunci scope-build; bukan validasi pasar/user interview)
- **Scope:** Keputusan scope-build berikutnya saja
- **Out-of-scope:** Menulis PRD v1 penuh baru, desain arsitektur detail, estimasi, klaim API/OS pihak ketiga

## Executive Summary

Kita membangun **satu pill glanceable top-center di Windows** agar sesi Pomodoro aktif terlihat tanpa membuka aplikasi lain — bukan OS baru. Build-lock v0.1: overlay fixed-size + Pomodoro deadline-based + notifikasi lokal + settings minimal (theme/position/startup). Media penuh, customization penuh, dan AI deferred ke v0.2+; request yang menyentuh 6 non-goals wajib ditolak/dipindah via ADR.

## 1. PRD Structure

```text
PRD
├── Problem
├── Users
├── Goals
├── User Stories
├── Core Features
├── Non-goals
├── Success Metrics
├── Constraints
└── MVP
```

### Problem

1. Konteks kerja tersebar: timer Pomodoro hidup di tab/app lain, tertutup window, poisoned oleh throttle.
2. Interupsi mahal: cek sisa waktu = alt-tab + kehilangan fokus.
3. Personalisasi kaku: widget bawaan tidak punya posisi/tema yang konsisten di Windows.

### Users

- Developer, Designer, Student di Windows 10/11 — butuh lihat sisa fokus sekilas, kontrol pause/resume tanpa konteks-switch.

### Goals

- UG-01: lihat sesi Pomodoro aktif sekilas tanpa buka aplikasi lain.
- UG-02: kontrol dasar (pause/resume/reset, mulai break) dari pill.
- UG-03: tidak kehilangan kebenaran timer saat freeze/throttle/sleep/lock.
- PG-01: idle ≈ negligible (CPU/GPU), sesuai doc performance.
- PG-02: satu sumber kebenaran timer di main process (deadline-based).

### User Stories

- Contoh (wajib jalan di v0.1): *As a Windows user, I want to see my active Pomodoro session without opening another application.*
- Turunan: pause/resume tanpa alt-tab; dapat toast+chime saat fase selesai meski minimized; settings tersimpan dan pulih setelah restart/crash.

### Core Features (v0.1 saja)

Overlay top-center expand/collapse, Pomodoro (focus/short/long, pause/resume/reset/skip), persistensi + recovery after sleep, notifikasi lokal + chime, settings minimal (durasi, siklus, auto-start flags, suara, theme, position, startup).

### Non-goals (eksplisit)

AI, plugin ecosystem, Spotify integration, browser integration, cloud sync, complex analytics — lihat `2026-09-17-mvp-definition-v01.md`. Masuk hanya via ADR v0.2+.

### Success Metrics (titik awal, wajib ukur lokal)

Sesi terlihat sekilas <1 dtk; timer benar setelah freeze/throttle/sleep; collapsed statis CPU/GPU ≈ 0; tidak ada repaint loop; settings/history survive restart.

### Constraints

Satu window kecil Electron, HW acceleration ON, tanpa acrylic/blur v1, tanpa telemetri, data lokal di `%APPDATA%` — lihat doc privacy-data + performance + pomodoro.

### MVP

Build-lock = MVP brutal-cut v0.1. Visi ikut PRD, acceptance ikut requirements, tetapi yang dibangun hanya user story Pomodoro glanceable (window collapsed + deadline engine + toast/chime + theme/position/startup minimal).

## Blocker

None untuk builder.
