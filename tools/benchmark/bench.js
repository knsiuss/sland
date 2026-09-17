// Benchmark runner placeholder with a real job: refuse to invent numbers.
// WHY: P6 budget numbers (X placeholders) must come from measured runs on target hardware,
// not from CI runners. This script documents the procedure and exits 0 until P6 wires it.
// Procedure (see docs/operations/observability.md PERF-001): collapsed static 60s ->
// record idle_cpu + memory_usage -> 5x expand/collapse -> record animation_frame_rate.
'use strict';
console.log('benchmark: no wired measurements yet (P6). Run PERF-001 manually on target hardware.');
