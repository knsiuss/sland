# Phase 1 — Windows Overlay + Window System

> Scope: SATU `BrowserWindow` overlay yang terasa bagian dari Windows. Tanpa Win32 custom di v1.
> Sumber: `docs/window-overlay.md` (living doc detail) + `research/2026-09-17-dynamic-island-windows.md`.

## 1.1 Keputusan kunci (jangan dilanggar)

- `frame:false, transparent:true, resizable:false, movable:false, minimizable:false, maximizable:false, fullscreenable:false, skipTaskbar:true, alwaysOnTop:true, level:'pop-up-menu', show:false → showInactive`, `backgroundColor:'#00000000'`, `contextIsolation:true, nodeIntegration:false`.
- Dua ukuran fixed: collapsed / expanded via `setSize` + reposisi. Bukan resize bebas.
- Pill = CSS `border-radius` (solid/semi-solid). Bukan Acrylic/Mica di v1. `backgroundMaterial` hanya eksperimen ber-flag Win11 22H2+.
- Click-through HANYA margin transparan: default `ignore:false`, margin `ignore:true,{forward:true}`, toggle berbasis hit-region (`mouseenter/mouseleave`), bukan timer.
- Posisi dari `workArea` dalam DIP, display target via cursor (`getCursorScreenPoint → getDisplayNearestPoint`), subscribe `display-added/removed/display-metrics-changed`.
- Startup via `app.setLoginItemSettings`. Tray wajib file ICO + ref global anti-GC.

## 1.2 Batasan yang disadari (bukan bug)

- Bisa tertutup fullscreen-exclusive game. Default aman: opsi "sembunyikan saat fullscreen".
- Tinggal di satu virtual desktop (`visibleOnAllWorkspaces` return false di Windows).
- Tanpa backdrop-blur real di v1.

## 1.3 Kontrak yang diekspor ke Phase 2+

```ts
// src/main/window/island-window.ts (akan dibuat saat build P1)
export interface IslandWindowApi {
  showInactive(): void;
  setCollapsedSize(w: number, h: number): void;
  setExpandedSize(w: number, h: number): void;
  moveToWorkAreaTopCenter(displayId?: number, marginPx?: number): void;
  setHitRegionClickable(clickable: boolean): void; // true = pill, false = margin click-through
  setHideOnFullscreen(hide: boolean): void;
}
```

P2–P7 hanya boleh pakai interface ini untuk urusan window. Tidak boleh panggil `BrowserWindow` langsung.

## 1.4 Definition of Done

- [ ] Window muncul top-center di atas taskbar (`pop-up-menu`), pill terklik, margin click-through.
- [ ] Re-layout benar saat: ganti DPI 100/125/150/200%, cabut-colok monitor, taskbar atas/bawah/auto-hide.
- [ ] Tidak ada `focus()` agresif. Opsi hide-saat-fullscreen ada dan default aman.
- [ ] Matriks uji `window-overlay.md` § "Matriks uji" minimal Win10 vs Win11 + 2 skala DPI + taskbar bawah lolos.

## 1.5 Non-goals

Win32 `IVirtualDesktopManager` pin, DWM corner-preference guarantee, snap layouts, Task Scheduler/registry manual.
