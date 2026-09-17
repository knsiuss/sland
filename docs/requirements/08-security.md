# 08 Security Requirements

- SEC-001 (v1): Least privilege — tidak minta admin, tidak ada capability melebihi kebutuhan fitur aktif.
- SEC-002 (v1): Renderer tanpa Node: `contextIsolation:true`, `nodeIntegration:false`, `sandbox:true`;
  satu-satunya jembatan = preload `window.island` minimal.
- SEC-003 (v1): Tanpa dynamic code loading — adapter statis yang di-bundle (lihat ADR-005).
- SEC-004 (v1): Single instance (`requestSingleInstanceLock`); instance kedua fokus ke yang ada.
- SEC-005 (v1): `openExternal` hanya untuk allowlist (https + skema app terdaftar); input user tidak
  boleh menjadi URL mentah.
- SEC-006 (v1): Satu window island saja yang boleh `alwaysOnTop`; tidak ada window siluman.
