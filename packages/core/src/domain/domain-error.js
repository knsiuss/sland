/**
 * @file Machine-readable error codes so branches never parse messages (FR-31; P3 §3.3). Pure zero-dep.
 */

/** Stable codes; adding is additive, renaming needs a doc update. */
export const DOMAIN_ERROR_CODES = Object.freeze({
  INVALID_INPUT: 'invalid-input',
  CORRUPT_PERSIST: 'corrupt-persist',
  TIMER_READ_CORRUPT: 'timer-read-corrupt',
  HISTORY_APPEND_FAILED: 'history-append-failed',
  CLOCK_JUMP_SUSPECTED: 'clock-jump-suspected',
  COMPLETED_WHILE_SUSPENDED: 'completed-while-suspended',
  RECOVERED_FROM_CRASH: 'recovered-from-crash',
  TRANSPORT_FAILED: 'transport-failed',
});

/**
 * Builds a frozen error; details stay ids/flags only, never PII (SEC-003).
 * @param {string} code - Known code.
 * @param {string} message - Human-readable English message.
 * @param {object} [details] - Plain object without PII.
 * @returns {object} Frozen {code, message, details}.
 * @throws {TypeError} On unknown code, empty message, or bad details.
 */
export function createDomainError(code, message, details) {
  if (!Object.values(DOMAIN_ERROR_CODES).includes(code)) {
    throw new TypeError(`createDomainError requires a known code, got ${String(code)}`);
  }
  if (typeof message !== 'string' || message.trim() === '') {
    throw new TypeError('createDomainError requires a non-empty message');
  }
  const cleanDetails = details === undefined || details === null ? {} : details;
  if (cleanDetails === null || typeof cleanDetails !== 'object' || Array.isArray(cleanDetails)) {
    throw new TypeError('createDomainError requires details as a plain object');
  }
  return Object.freeze({ code, message, details: Object.freeze({ ...cleanDetails }) });
}

/**
 * Narrows unknown values at bus/store boundaries; never throws.
 * @param {unknown} value - Candidate.
 * @returns {boolean} True when code/message are well-formed.
 */
export function isDomainError(value) {
  return value !== null
    && typeof value === 'object'
    && Object.values(DOMAIN_ERROR_CODES).includes(value.code)
    && typeof value.message === 'string'
    && value.message !== '';
}
