# packages/core (P2 — pure, zero-dep)

Single State Manager engine. `src/{Domain,Events,State,Abstractions}` hold types, reducer, queue, history, timeout-registry.

Hard rules (auto-rejected otherwise):
- No `electron`, `react`, or app imports. No `Date.now()`/`Math.random` inside the reducer — `now` is injected.
- Magic numbers reference docs (`// P2: transient default 4000`).
- Contract tests in `tests/`: the 5 cases from `docs/phase-2-state-event.md` §2.4.
