/**
 * @file Static adapter shape + registry so the bus never branches (ADR-005; P4 §4.1). Pure zero-dep.
 */

/** Adapter ids are short static slugs (ADR-005). */
export const ADAPTER_ID_PATTERN = /^[a-z0-9-]+$/;

/**
 * Validates untrusted candidates collecting every problem; extra keys allowed. Never throws.
 * @param {unknown} candidate - Untrusted adapter shape.
 * @returns {{ok: boolean, errors: string[]}} Verdict with all errors.
 */
export function validateAdapter(candidate) {
  if (candidate === null || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return { ok: false, errors: ['adapter must be an object'] };
  }
  const errors = [];
  if (typeof candidate.id !== 'string' || !ADAPTER_ID_PATTERN.test(candidate.id)) {
    errors.push('adapter.id must be a kebab-case non-empty string');
  }
  if (typeof candidate.match !== 'function') {
    errors.push('adapter.match must be a function');
  }
  if (typeof candidate.map !== 'function') {
    errors.push('adapter.map must be a function');
  }
  if (!Array.isArray(candidate.commands)) {
    errors.push('adapter.commands must be an array');
  } else {
    candidate.commands.forEach((command, index) => {
      if (typeof command !== 'string' || command === '') {
        errors.push(`adapter.commands[${index}] must be a non-empty string`);
      }
    });
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Builds a frozen registry from a static array; duplicates/invalid fail the whole boot. Never throws.
 * @param {unknown} adapters - Static adapter references, never a folder path.
 * @returns {{ok: boolean, registry: object|undefined, errors: string[]}} Frozen {ids, byId} or errors.
 */
export function createAdapterRegistry(adapters) {
  if (!Array.isArray(adapters)) {
    return { ok: false, errors: ['registry needs an adapter array'] };
  }
  if (adapters.length === 0) {
    return { ok: false, errors: ['registry needs at least one adapter'] };
  }
  const errors = [];
  const seen = new Set();
  const byId = {};
  adapters.forEach((adapter, index) => {
    const checked = validateAdapter(adapter);
    if (!checked.ok) {
      errors.push(`adapters[${index}] invalid: ${checked.errors.join('; ')}`);
      return;
    }
    if (seen.has(adapter.id)) {
      errors.push(`duplicate adapter id "${adapter.id}"`);
      return;
    }
    seen.add(adapter.id);
    byId[adapter.id] = adapter;
  });
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    errors: [],
    registry: Object.freeze({ ids: Object.freeze([...seen]), byId: Object.freeze({ ...byId }) }),
  };
}
