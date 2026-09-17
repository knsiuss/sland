/**
 * @file Single deadline truth for domain timers (P3 §3.1). Pure zero-dep, now-injected.
 */
export const CLOCK_JUMP_BASE_MS = 30_000;

function requireNow(now, owner) {
  if (typeof now !== 'number' || !Number.isFinite(now)) {
    throw new TypeError(`${owner} requires a finite now epoch-ms`);
  }
}

function requireEpoch(value, name, owner) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${owner} requires a finite ${name} epoch-ms`);
  }
}

/**
 * Wall elapsed between two epoch stamps.
 * @param {number} fromEpochMs - Start epoch-ms UTC.
 * @param {number} now - End epoch-ms UTC (injected).
 * @returns {number} Elapsed ms.
 * @throws {TypeError} On non-finite epochs (caller bug).
 */
export function elapsedMs(fromEpochMs, now) {
  requireEpoch(fromEpochMs, 'fromEpochMs', 'elapsedMs');
  requireNow(now, 'elapsedMs');
  return now - fromEpochMs;
}

/**
 * Remaining time for a deadline (ADR-001). Positive = remaining, <=0 = overdue.
 * @param {number} deadlineEpochMs - Target end epoch-ms UTC.
 * @param {number} now - Injected epoch-ms UTC.
 * @returns {number} deadlineEpochMs - now.
 */
export function remainingMs(deadlineEpochMs, now) {
  requireEpoch(deadlineEpochMs, 'deadlineEpochMs', 'remainingMs');
  requireNow(now, 'remainingMs');
  return deadlineEpochMs - now;
}

/**
 * Overdue check for boot/tick reconcile (P3 §3.3).
 * @param {number} deadlineEpochMs - Target end epoch-ms UTC.
 * @param {number} now - Injected epoch-ms UTC.
 * @returns {boolean} True when overdue.
 */
export function isOverdue(deadlineEpochMs, now) {
  return remainingMs(deadlineEpochMs, now) <= 0;
}

/**
 * Epoch-ms to ISO UTC string for display/history (P3 §3.1).
 * @param {number} epochMs - Epoch-ms UTC.
 * @returns {string} ISO UTC string.
 * @throws {TypeError} On bad epoch (caller bug).
 */
export function toIsoUtc(epochMs) {
  requireEpoch(epochMs, 'epochMs', 'toIsoUtc');
  return new Date(epochMs).toISOString();
}

/**
 * Clock-jump threshold max(30s, 10% duration) (research §3).
 * @param {number} durationMs - Planned session length.
 * @returns {number} Threshold ms.
 */
export function clockJumpThresholdMs(durationMs) {
  if (typeof durationMs !== 'number' || !Number.isFinite(durationMs) || durationMs < 0) {
    throw new TypeError('clockJumpThresholdMs requires a finite non-negative durationMs');
  }
  return Math.max(CLOCK_JUMP_BASE_MS, Math.floor(durationMs * 0.1));
}

/**
 * Wall vs monotonic drift check; wall-clock always wins, flag marks history only (research §3).
 * @param {number} wallElapsedMs - Wall elapsed.
 * @param {number} monoElapsedMs - Monotonic elapsed.
 * @param {number} durationMs - Planned session length.
 * @returns {{suspected: boolean, thresholdMs: number}} Drift verdict.
 */
export function isClockJumpSuspected(wallElapsedMs, monoElapsedMs, durationMs) {
  for (const [name, value] of [['wallElapsedMs', wallElapsedMs], ['monoElapsedMs', monoElapsedMs]]) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError(`isClockJumpSuspected requires a finite ${name}`);
    }
  }
  const thresholdMs = clockJumpThresholdMs(durationMs);
  return { suspected: Math.abs(wallElapsedMs - monoElapsedMs) > thresholdMs, thresholdMs };
}
