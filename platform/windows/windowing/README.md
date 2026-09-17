# platform/windows/windowing (P1)

Owns the overlay HWND via `IslandWindowApi` (the ONLY `BrowserWindow` owner): `frame:false, transparent:true, resizable:false`, `level:'pop-up-menu'`, fixed collapsed/expanded `setSize`, `workArea`-DIP positioning, `display-added/removed/metrics-changed` re-layout, `setIgnoreMouseEvents` hit-region, tray (ICO required), `setLoginItemSettings`.

Never: `focus()` stealing, resize-free windows, promises about fullscreen-exclusive or virtual desktops.
