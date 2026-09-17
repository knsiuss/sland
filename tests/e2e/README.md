# tests/e2e

Full user journeys, manual-recorded in v1 (formal E2E automation deferred to P6):

- E2E-01: start focus → GitHub notification → 4s peek → back to remaining time (FR-41/42).
- E2E-02: kill mid-focus → relaunch reconstructs correctly (FR-13).
- E2E-03: Spotify + YouTube control from the island (FR-20).

Each run records: version, OS build, result, link to diagnostics on failure. App-scoped harness (when built) lives in `apps/desktop/tests/e2e`.
