# Phase 5 — Customization

> Scope: satu schema JSON berversi + satu store + satu jalur tulis. Apply instan tanpa reload.
> Sumber: `research/2026-09-17-customization-system.md`.

## 5.1 Keputusan kunci

- Store = `electron-store` (`%APPDATA%\<App>\config.json`), `schema` ajv draft-2020-12 + `defaults` + `migrations` sejak v1, tulis atomik.
- Schema v1 = `configVersion:1` + enum `theme/position/size/animation/workspaceBehavior/fullscreenBehavior` + pattern hex `accent` + boolean tiap `modules` + range `transparency 0.4–1.0, radius 8–32, autoHideIdleSeconds 3–60`. `additionalProperties:false` + strip-unknown-dengan-warning saat import.
- Theme = `nativeTheme.themeSource: system` default + token → CSS vars (`--accent, --island-opacity, --island-radius, --island-anim`), `[data-theme]` ikut `shouldUseDarkColors`. Blur real out-of-scope (flag forward-compatible default `false`, fallback opacity).
- Position/behavior = window API (`setBounds/setAlwaysOnTop/visibleOnAllWorkspaces`) + P2 (`autoHide→Dormant`, `expandOnHover: HOVER→Expanded`). `custom` di-clamp ke workArea, fallback `top-center`.
- Modules = boolean feature-flags + conditional render. `false` = actor tidak di-spawn + event kategori di-drop di bus (kontrak anti bug #4738 dengan P2).
- Profiles = satu store + `profiles/items + activeProfileId` (bukan satu-file-per-profil di v1). Import/export = dialog → parse → ajv → tolak/error-terkumpul + backup `.bak` (max 5, rotate) sebelum overwrite. File korup → backup + defaults + banner.

## 5.2 Aturan tulis

Hanya saat: user ubah (debounce 100–200ms untuk slider), ganti profil, import, migrasi boot. Jangan tulis tiap tick Pomodoro/media-progress. Gagal validasi = tolak + tampilkan error, pertahankan nilai lama.

## 5.3 Definition of Done

- [ ] Unit test `src/shared/config`: contoh lama tanpa version→migrasi v1; accent tak valid ditolak semua-error-terkumpul; unknown keys strip+warning; file korup→defaults+backup; import v-masa-depan ditolak jelas.
- [ ] Ganti theme/accent/transparency/radius/animasi instan tanpa reload + preview debounce.
- [ ] `modules.*=false` terbukti tidak menahan island (test integrasi dengan P2).

## 5.4 Non-goals

Store/distribusi tema, plugin runtime pihak-ketiga (RFC terpisah v2+), sync cloud multi-device, SQLite settings (boleh untuk history v2).
