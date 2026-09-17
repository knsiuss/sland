/** @file P2 event contract: one frozen shape so the bus never branches (P2 §2.2; ADR-003); pure zero-dep. */

/** Stable contract allowlist; changes need a doc update first (P2 §2.2). */
export const EVENT_TYPES = Object.freeze([
  'POMODORO.STARTED',
  'POMODORO.PAUSED',
  'POMODORO.TICK',
  'POMODORO.FINISHED',
  'MEDIA.TRACK_CHANGED',
  'MEDIA.PLAY_PAUSE',
  'MEDIA.STOPPED',
  'NOTIFY.RECEIVED',
  'NOTIFY.DISMISSED',
  'SPEEDTEST.PROGRESS',
  'SPEEDTEST.FINISHED',
  'AI.ANSWER_RECEIVED',
  'AI.LISTENING',
  'AI.PINNED',
  'MIC.STATE_CHANGED',
  'USER.HOVER',
  'USER.LEAVE',
  'USER.CLICK',
  'USER.DISMISS',
  'SYSTEM.TIMEOUT',
  'SYSTEM.QUEUE_DRAINED',
]);

/** Priority bands; higher preempts, ties keep the incumbent (P2 §2.1; SER-004). */
export const PRIORITY = Object.freeze({
  CRITICAL: 100,
  URGENT: 80,
  TRANSIENT: 60,
  MEDIA_EVENT: 40,
  PERSISTENT: 20,
  IDLE: 0,
});

export const SURFACES = Object.freeze(['dormant', 'compact', 'peek', 'expanded']);

/** Structural constants with doc refs, never inline in the reducer (P2 §2.1). */
export const TRANSIENT_DEFAULT_MS = 4000;
export const QUEUE_CAP = 20;
export const HISTORY_MAX = 5;
/** Floor one above MEDIA_EVENT so it cannot preempt a sticky persistent owner (P2 §2.1). */
export const STICKY_PREEMPT_FLOOR = PRIORITY.MEDIA_EVENT + 1;

/** Types ending a source, deleting it from the registry. */
export const END_TYPES = Object.freeze(['MEDIA.STOPPED', 'NOTIFY.DISMISSED']);

function requireFiniteNow(now, owner) {
  if (typeof now !== 'number' || !Number.isFinite(now)) {
    throw new TypeError(`${owner} requires a finite now epoch-ms`);
  }
}

/**
 * Producer-built frozen event; reducer itself stays total on well-formed input.
 * @param {object} args - Event fields with contract type.
 * @param {number} now - Injected epoch-ms UTC.
 * @returns {object} Frozen event.
 * @throws {TypeError} On caller bug (bad now, id, type, priority, or payload).
 */
export function createEvent(args, now) {
  requireFiniteNow(now, 'createEvent');
  const { id, type, category, priority, timeoutMs = null, payload = {}, sticky = false, isResolver = true } = args ?? {};
  if (typeof id !== 'string' || id === '') throw new TypeError('createEvent requires a non-empty id string');
  if (!EVENT_TYPES.includes(type)) throw new TypeError(`createEvent: unknown type ${String(type)} (contract change needs a doc update)`);
  if (typeof category !== 'string' || category === '') throw new TypeError('createEvent requires a non-empty category');
  if (typeof priority !== 'number' || !Number.isFinite(priority)) throw new TypeError('createEvent requires a finite priority');
  if (timeoutMs !== null && (typeof timeoutMs !== 'number' || !Number.isFinite(timeoutMs) || timeoutMs <= 0)) {
    throw new TypeError('createEvent requires timeoutMs null or positive finite ms');
  }
  if (payload === null || typeof payload !== 'object') throw new TypeError('createEvent requires a payload object');
  return Object.freeze({
    id, type, category, priority, timeoutMs,
    timestamp: now,
    payload: Object.freeze({ ...payload }),
    sticky: sticky === true,
    isResolver: isResolver !== false,
  });
}

/**
 * Narrows unknown bus input; never throws, reducer drops invalid input.
 * @param {unknown} value - Candidate.
 * @returns {boolean} True when a contract island event.
 */
export function isIslandEvent(value) {
  if (value === null || typeof value !== 'object') return false;
  const e = value;
  return typeof e.id === 'string' && e.id !== ''
    && EVENT_TYPES.includes(e.type)
    && typeof e.category === 'string' && e.category !== ''
    && typeof e.priority === 'number' && Number.isFinite(e.priority);
}
