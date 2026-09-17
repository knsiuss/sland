/**
 * @file Deterministic unique ids from injected now + sequence, no randomness (P2 §2.2). Pure zero-dep.
 */

/**
 * Bus-ingest id check (P2 §2.2); never throws.
 * @param {unknown} value - Candidate.
 * @returns {boolean} True for non-empty trimmed strings.
 */
export function isValidId(value) {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * Factory minting `${prefix}-${now}-${seq}` with seq from 1; never silently collides.
 * @param {string} prefix - Short whitespace-free kind.
 * @returns {{next: function, count: number}} Factory with next(now) and count.
 * @throws {TypeError} On bad prefix or non-finite now (caller bug).
 */
export function createIdFactory(prefix) {
  if (typeof prefix !== 'string' || prefix.trim() === '' || /\s/.test(prefix)) {
    throw new TypeError('createIdFactory requires a non-empty whitespace-free prefix');
  }
  let sequence = 0;
  return {
    next(now) {
      if (typeof now !== 'number' || !Number.isFinite(now)) {
        throw new TypeError('idFactory.next requires a finite now epoch-ms');
      }
      sequence += 1;
      return `${prefix}-${now}-${sequence}`;
    },
    get count() {
      return sequence;
    },
  };
}
