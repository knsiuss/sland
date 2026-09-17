# packages/configuration (P5 — pure)

`configVersion` + enum/pattern/clamp + `additionalProperties:false`; `sanitizeConfig` collects ALL errors (never fail-fast-one); `migrateConfig` steps v1→v2→…; corrupt file → backup `.bak` + defaults + banner (never crash).

Rules: `modules.*=false` means the actor is not spawned and its events are dropped at the bus. 5 unit tests from `docs/phase-5-customization.md` §5.3. Secrets never live here (see `packages/telemetry`? no — see SECURITY.md: OS credential store).
