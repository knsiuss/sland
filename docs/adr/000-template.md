# ADR Template

> Copy file ini menjadi `NNN-judul-singkat.md`. Nomor urut, tidak pernah dipakai ulang. Status awal selalu `Proposed`.

```markdown
# ADR-NNN: Judul Keputusan

- **Tanggal:** YYYY-MM-DD
- **Status:** Proposed | Accepted | Deprecated | Superseded-by: ADR-XXX

## Context

Masalah apa yang memaksa keputusan ini? Batasan apa yang berlaku?
Fakta vs asumsi dipisah bila relevan.

## Decision

Keputusan yang diambil, kalimat tunggal yang bisa dikutip.

## Consequences

Positif dan negatif yang diterima secara sadar. Termasuk apa yang
sengaja TIDAK dilakukan.

## Alternatives considered

Opsi yang ditolak + satu kalimat alasan penolakan masing-masing.
```

Aturan:

- Satu ADR = satu keputusan. Jangan borong.
- `Proposed` → `Accepted` hanya setelah spike/implementasi membuktikan.
- ADR yang salah tidak dihapus — status jadi `Deprecated` + alasan.
