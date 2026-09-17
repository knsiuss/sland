# packages/telemetry (P6)

Local-only observability: `{ts, level, scope, event, data}` JSONL, ring-buffer cap (~5 MB rotate), the 7 metrics from `docs/operations/observability.md`, on-demand "Export diagnostics" bundle (secrets redacted).

Hard rule: no network transport, no analytics SDK, no tracking. If it phones home, it does not ship.
