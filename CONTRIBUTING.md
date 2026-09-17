# Contributing

1. Read `AGENTS.md` (binding), then `docs/README.md`, then your target `docs/phase-N-*.md`. Never skip.
2. One diff = one DoD item. Message format: `Phase: N — <what> (DoD <x>)`.
3. No new dependency without reason + rejected alternatives in the diff (AGENTS.md §4.6). P2 (`packages/core`) stays zero-dependency.
4. Every requirement ID you touch needs a test (`docs/requirements/13-traceability.md` updated in the same diff).
5. PRs use `.github/pull_request_template.md`. `main` is protected (see `docs/operations/cicd.md`).
