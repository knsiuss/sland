# Phase 7 — AI / Agent Layer

> Scope: `MAX` assistant sebagai consumer P2+P5. Bukan otak baru yang merebut State Manager.
> Sumber: slot `6. AI Assistant` di `images/` + flag `modules.ai` (default false) di P5. Belum ada research standalone.

## 7.1 Keputusan kunci

- AI = satu actor `ai` di P2 dengan priority transient 60 (setara notif) untuk jawaban, urgent 80 hanya untuk alarm/timer-done. Tidak boleh pinned kecuali user pin eksplisit.
- Privasi default (sesuai image: "Your data stays on your device"): inferensi lokal-first / BYOK. Tanpa kunci = slot MAX tampil sebagai launcher (Summarize/Search/Open App deep-link), bukan chat penuh. Dilarang kirim clipboard/notif/file tanpa consent eksplisit per-aksi.
- Kontrak event reuse P2: `AI.ANSWER_RECEIVED (60, 4000–8000ms) / AI.LISTENING (40, secondary bubble) / AI.PINNED (100, null, butuh dismiss)`. Payload ter-sanitize (max length, strip HTML).
- Config reuse P5: `modules.ai`, `behavior` sama. Tanpa schema baru bila bisa (tambah `ai: { provider, model, apiKeyRef }` hanya bila spike lolos + secret via `safeStorage`).
- UI reuse: compact = status (`MAX · Listening…`), expanded = prompt + 3 aksi (Summarize/Search/Open App) sesuai image. Tanpa webview remote tak-tervalidasi.

## 7.2 Definition of Done

- [ ] `modules.ai=false` → actor tidak spawn + event AI di-drop (sesuai kontrak P2/P5).
- [ ] Tanpa kunci/provider: tidak ada network call, slot tetap berguna sebagai launcher.
- [ ] Dengan provider: jawaban tampil transient + restore history benar (test seperti P2: AI → Pomodoro kembali).
- [ ] Audit privasi: tidak ada exfil clipboard/notif tanpa consent log.

## 7.3 Non-goals (v1)

Agent otonom (baca file sembarang/eksekusi perintah), sync cloud memory, store/distribusi skill, voice always-on.
