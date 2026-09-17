/**
 * @file Generic frozen event envelope so the P2 bus never branches (ADR-003; P2 §2.2). Pure zero-dep.
 */

/**
 * Generic narrow; payload specifics belong to the contract layer. Never throws.
 * @param {unknown} value - Candidate.
 * @returns {boolean} True when id/type/category/priority are well-formed.
 */
export function isDomainEvent(value) {
  if (value === null || typeof value !== 'object') return false;
  return typeof value.id === 'string' && value.id !== ''
    && typeof value.type === 'string' && value.type !== ''
    && typeof value.category === 'string' && value.category !== ''
    && typeof value.priority === 'number' && Number.isFinite(value.priority);
}

/**
 * Builds a frozen envelope; bus re-injects timestamp on ingest.
 * @param {object} args - Event fields.
 * @param {number} now - Injected epoch-ms UTC.
 * @returns {object} Frozen event.
 * @throws {TypeError} On caller bug (bad now or fields).
 */
export function createDomainEvent(args, now) {
  if (typeof now !== 'number' || !Number.isFinite(now)) {
    throw new TypeError('createDomainEvent requires a finite now epoch-ms');
  }
  const { id, type, category, priority, timeoutMs = null, payload = {}, sticky = false } = args ?? {};
  if (typeof id !== 'string' || id === '') throw new TypeError('createDomainEvent requires a non-empty id');
  if (typeof type !== 'string' || type === '') throw new TypeError('createDomainEvent requires a non-empty type');
  if (typeof category !== 'string' || category === '') throw new TypeError('createDomainEvent requires a non-empty category');
  if (typeof priority !== 'number' || !Number.isFinite(priority)) {
    throw new TypeError('createDomainEvent requires a finite priority');
  }
  if (timeoutMs !== null && (typeof timeoutMs !== 'number' || !Number.isFinite(timeoutMs) || timeoutMs <= 0)) {
    throw new TypeError('createDomainEvent requires timeoutMs null or positive finite ms');
  }
  if (payload === null || typeof payload !== 'object') throw new TypeError('createDomainEvent requires a payload object');
  return Object.freeze({
    id, type, category, priority, timeoutMs,
    timestamp: now,
    payload: Object.freeze({ ...payload }),
    sticky: sticky === true,
  });
}

/**
 * Validates untrusted producer output collecting every problem (DAR-006); invalid yields null.
 * @param {unknown} raw - Untrusted producer output.
 * @param {number} now - Bus-authoritative timestamp epoch-ms.
 * @returns {{event: object|null, errors: string[]}} Event or null plus errors.
 * @throws {TypeError} On non-finite now (caller bug).
 */
export function validateDomainEvent(raw, now) {
  if (typeof now !== 'number' || !Number.isFinite(now)) {
    throw new TypeError('validateDomainEvent requires a finite now epoch-ms');
  }
  const errors = [];
  if (raw === null || typeof raw !== 'object') return { event: null, errors: ['event must be an object'] };
  if (typeof raw.id !== 'string' || raw.id === '') errors.push('id must be a non-empty string');
  if (typeof raw.type !== 'string' || raw.type === '') errors.push('type must be a non-empty string');
  if (typeof raw.category !== 'string' || raw.category === '') errors.push('category must be a non-empty string');
  if (typeof raw.priority !== 'number' || !Number.isFinite(raw.priority)) errors.push('priority must be a finite number');
  if (!(raw.timeoutMs === null || raw.timeoutMs === undefined
    || (typeof raw.timeoutMs === 'number' && Number.isFinite(raw.timeoutMs) && raw.timeoutMs > 0))) {
    errors.push('timeoutMs must be null or a positive finite number');
  }
  if (typeof raw.sticky !== 'boolean') errors.push('sticky must be a boolean');
  if (errors.length > 0) return { event: null, errors };
  return {
    event: {
      id: raw.id,
      type: raw.type,
      category: raw.category,
      priority: raw.priority,
      timeoutMs: raw.timeoutMs ?? null,
      timestamp: now,
      payload: raw.payload !== null && typeof raw.payload === 'object' ? raw.payload : {},
      sticky: raw.sticky,
    },
    errors,
  };
}
