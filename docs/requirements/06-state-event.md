# 06 State & Event Requirements

Kontrak perilaku penuh: `../state-machine.md`. Di sini hanya requirement-nya:

- SER-001 (v1): Visibility tepat 3 state: `DORMANT / COMPACT / EXPANDED`.
- SER-002 (v1): Satu resolver prioritas memutuskan content; widget dilarang rebut slot.
- SER-003 (v1): Transient (notifikasi) preempt maksimal 4 dtk lalu yield ke incumbent.
- SER-004 (v1): Prioritas seri → incumbent menang (anti-flicker).
- SER-005 (v1): Transient tidak mengantre; latest-wins + coalesce.
- SER-006 (v1): Tick timeline media bukan event resolver (hanya update progress).
- SER-007 (v1): Setiap transisi log `{from, to, reason, at}` (ring buffer 50).
