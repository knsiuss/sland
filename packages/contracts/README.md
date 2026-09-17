# packages/contracts

Single source of truth for cross-boundary shapes: `Events/` (`IslandEvent` + `IslandEventType`, see P2 §2.2), `Commands/` (timer/island/config intents = `docs/api/contracts.md` IPC table), `DTOs/` (MediaState, SystemState, AppPresence, SessionRecord).

Rule: contract change without updating the owning phase doc + `13-traceability.md` is auto-rejected at review.
