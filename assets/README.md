# assets

Binaries are NEVER committed (review flow rejects them). This tree reserves the layout:

- `icons/` — tray + installer icons. **ICO required from day one** (fallback "no icon file" is invalid — `new Tray()` needs a file; see `docs/window-overlay.md` §14). Source SVG + export script land here in P1.
- `sounds/` — local phase-complete chimes (short WAV/MP3 <2s, preloaded after first user gesture; never remote-fetch on transition).
- `fonts/` — only if a non-system font is justified (system stack preferred).
- `themes/` — token packs mapping to CSS variables (see customization research).

Each asset needs: source, license, and the code reference that loads it.
