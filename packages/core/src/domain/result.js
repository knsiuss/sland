/**
 * @file Ok/err envelope so sanitize paths return values + errors (DAR-006). Pure zero-dep.
 */

export const RESULT_KIND_OK = 'ok';
export const RESULT_KIND_ERR = 'err';

function normalizeErrors(errors) {
  if (errors === undefined || errors === null) return ['unknown error'];
  const list = Array.isArray(errors) ? errors : [errors];
  return list.map((entry) => (typeof entry === 'string' ? entry : String(entry ?? 'unknown error')));
}

/**
 * Success wrapper; kind carries success since value may be null.
 * @param {unknown} value - Usable value.
 * @returns {{kind: string, value: unknown, errors: string[]}} Ok result.
 */
export function ok(value) {
  return { kind: RESULT_KIND_OK, value, errors: [] };
}

/**
 * Collected errors, never fail-fast single (DAR-006). Never throws.
 * @param {unknown} errors - Single error or array.
 * @returns {{kind: string, value: null, errors: string[]}} Err result.
 */
export function err(errors) {
  return { kind: RESULT_KIND_ERR, value: null, errors: normalizeErrors(errors) };
}

/** Ok narrow; never throws. @param {unknown} result - Candidate. @returns {boolean} True when ok. */
export function isOk(result) {
  return result !== null && typeof result === 'object' && result.kind === RESULT_KIND_OK;
}

/** Err narrow; never throws. @param {unknown} result - Candidate. @returns {boolean} True when err. */
export function isErr(result) {
  return result !== null && typeof result === 'object' && result.kind === RESULT_KIND_ERR;
}

/**
 * Total reader returning fallback on err; never throws.
 * @param {unknown} result - Ok/err result.
 * @param {unknown} fallback - Value for err path.
 * @returns {unknown} Value or fallback.
 */
export function unwrapOr(result, fallback) {
  return isOk(result) ? result.value : fallback;
}

/**
 * Combines N results collecting every error in order (DAR-006).
 * @param {unknown} results - Result or array of results.
 * @returns {{kind: string, value: unknown, errors: string[]}} Values on ok, concatenated errors on err.
 */
export function combine(results) {
  const list = Array.isArray(results) ? results : [results];
  const values = [];
  const errors = [];
  for (const entry of list) {
    if (isOk(entry)) {
      values.push(entry.value);
    } else if (isErr(entry)) {
      errors.push(...entry.errors);
    } else {
      errors.push('combine requires ok/err results');
    }
  }
  return errors.length > 0 ? err(errors) : ok(values);
}
