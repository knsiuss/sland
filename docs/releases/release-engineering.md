# Release Engineering

## Versioning

SemVer (`vMAJOR.MINOR.PATCH`): `MAJOR` = kontrak pecah (event/config/IPC), `MINOR` = fitur kompatibel, `PATCH` = fix. Peta kasar: `v0.1.0` = P1–P2 (overlay + state), `v0.2.0` = P3–P5 (pomodoro + integration + customization), `v1.0.0` = P6–P7 hijau + angka X terisi + matriks manual penuh. `appVersion` selalu disimpan di persist untuk migrasi.

## Release notes

Ditulis dari `releases/changelog.md` (Keep a Changelog: Added/Changed/Fixed/Security). Wajib menyebut: perubahan perilaku terlihat, perubahan kontrak, migrasi config, isu diketahui + workaround (jujur, bukan disembunyikan).

## Installer

electron-builder → installer Windows + ICO tray tervalidasi + startup `setLoginItemSettings` teruji pasca-instal. Satu artefak per tag, checksum dicatat di GitHub Release.

## Rollback

- Prosedur: instal versi terakhir hijau menimpa versi rusak (RB-005) — tidak ada auto-rollback yang menimpa data user.
- Data aman karena migrasi hanya maju + backup `.bak` sebelum overwrite; downgrade schema pakai backup (lihat bawah).

## Migration & configuration compatibility

```
v1 config  →  migration (berurutan v1→v2→…)  →  v2 config
   (backup .bak dulu)      (ajv validasi tiap langkah)   (persist + banner)
```

Aturan:

- `configVersion` naik hanya saat schema berubah; migrasi berurutan, tidak loncat.
- Import/config versi lebih baru dari app → tolak jelas (jangan parse setengah).
- Unknown keys minor → strip + warning (forward-compatible); fatal (enum/tipe/required) → tolak seluruh tulis, pertahankan config lama.
- Setiap overwrite import/migrasi = backup `config.bak-<ts>.json` (max 5, rotate).
- Uji wajib tiap rilis yang menyentuh schema: 5 config tests (migrasi, accent invalid, unknown keys, file korup, versi masa depan).
