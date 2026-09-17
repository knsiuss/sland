/**
 * @file AI permission tiers answering "may tier T do X" before any AI code (ADR-006). Pure zero-dep.
 */

/** Tiers 0 off (default) < 1 observe < 2 suggest < 3 act (ADR-006). */
export const AI_TIERS = Object.freeze({ off: 0, observe: 1, suggest: 2, act: 3 });

/** Sensitive categories defaulting to tier 0 for explicit review (ADR-006). */
export const AI_SENSITIVE_CATEGORIES = Object.freeze(['microphone', 'screen']);

/** Actions denied at every tier, even with explicit grant (ADR-006 hard rule 2). */
export const AI_FORBIDDEN_ACTS = Object.freeze([
  'kill-process',
  'close-process',
  'change-system-settings',
  'exfiltrate-data',
  'send-data',
  'delete-files',
]);

function asTier(value) {
  return Number.isInteger(value) && value >= 0 && value <= 3 ? value : AI_TIERS.off;
}

function isCategory(value) {
  return typeof value === 'string' && value.trim() !== '' && value.length <= 64;
}

/**
 * Resolves grants at config.ai; ungranted or malformed resolves off (fail-closed). Never throws.
 * @param {unknown} config - Sanitized IslandConfig (tolerates raw input).
 * @param {unknown} category - Permission category.
 * @returns {number} Tier 0-3.
 */
export function resolveTier(config, category) {
  if (!isCategory(category)) return AI_TIERS.off;
  const grants = config !== null && typeof config === 'object' && config.ai !== null && typeof config.ai === 'object'
    ? config.ai
    : null;
  if (!grants) return AI_TIERS.off;
  return asTier(grants[category.trim()]);
}

/**
 * Observe gate at tier 1+; malformed tiers resolve off. Never throws.
 * @param {unknown} tier - Candidate tier.
 * @returns {boolean} True when observing is allowed.
 */
export function canObserve(tier) {
  return asTier(tier) >= AI_TIERS.observe;
}

/**
 * Suggest gate at tier 2+; malformed tiers resolve off. Never throws.
 * @param {unknown} tier - Candidate tier.
 * @returns {boolean} True when suggesting is allowed.
 */
export function canSuggest(tier) {
  return asTier(tier) >= AI_TIERS.suggest;
}

/**
 * Act gate for tier 3 plus allowlisted action; forbidden acts always deny. Never throws.
 * @param {unknown} tier - Candidate tier.
 * @param {unknown} action - Requested action.
 * @returns {boolean} True when acting is allowed.
 */
export function canAct(tier, action) {
  if (asTier(tier) < AI_TIERS.act) return false;
  if (typeof action !== 'string' || action.trim() === '') return false;
  return !AI_FORBIDDEN_ACTS.includes(action.trim());
}

/**
 * Consent-revocation path one step toward off, never toward access (ADR-006 rule 4). Never throws.
 * @param {unknown} tier - Candidate tier.
 * @returns {number} Stepped-down tier.
 */
export function stepDownTier(tier) {
  return Math.max(AI_TIERS.off, asTier(tier) - 1);
}

/**
 * Builds a frozen tier-3 audit entry with ISO UTC stamp; never silently degrades (ADR-006 rule 3).
 * @param {object} args - Entry fields with tier, action, and category.
 * @param {number} now - Injected epoch-ms UTC.
 * @returns {object} Frozen {tier, action, category, at}.
 * @throws {TypeError} On bad now, tier, action, or category (caller bug).
 */
export function buildAuditEntry(args, now) {
  if (typeof now !== 'number' || !Number.isFinite(now)) {
    throw new TypeError('buildAuditEntry requires a finite now epoch-ms');
  }
  const { tier, action, category } = args ?? {};
  if (!Number.isInteger(tier) || tier < 0 || tier > 3) throw new TypeError('buildAuditEntry requires a tier 0-3');
  if (typeof action !== 'string' || action.trim() === '') throw new TypeError('buildAuditEntry requires a non-empty action');
  if (!isCategory(category)) throw new TypeError('buildAuditEntry requires a valid category');
  return Object.freeze({ tier, action: action.trim(), category: category.trim(), at: new Date(now).toISOString() });
}
