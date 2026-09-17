/**
 * @file Pure profile CRUD computing the next config; switching never rewrites sections (P5 §5.1). Pure zero-dep.
 */

export const BUILT_IN_PROFILES = Object.freeze([
  Object.freeze({ id: 'default', name: 'Default' }),
  Object.freeze({ id: 'focus', name: 'Focus' }),
  Object.freeze({ id: 'gaming', name: 'Gaming' }),
  Object.freeze({ id: 'minimal', name: 'Minimal' }),
]);

export const BUILT_IN_PROFILE_IDS = Object.freeze(BUILT_IN_PROFILES.map((preset) => preset.id));

function isRecord(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function trimmedOrEmpty(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Reads the profiles section into a fresh copy; repair belongs to sanitize. Never throws.
 * @param {unknown} config - Sanitized config.
 * @returns {{ok: boolean, activeProfileId?: string, items?: object, errors?: string[]}} Section or errors.
 */
function readProfiles(config) {
  if (!isRecord(config)) return { ok: false, errors: ['config must be an object'] };
  const profiles = config.profiles;
  if (!isRecord(profiles)) return { ok: false, errors: ['profiles must be an object'] };
  if (typeof profiles.activeProfileId !== 'string' || profiles.activeProfileId.trim() === '') {
    return { ok: false, errors: ['profiles.activeProfileId must be a non-empty string'] };
  }
  if (!isRecord(profiles.items)) return { ok: false, errors: ['profiles.items must be an object'] };
  const items = {};
  for (const [id, entry] of Object.entries(profiles.items)) {
    if (!isRecord(entry) || typeof entry.name !== 'string') {
      return { ok: false, errors: [`profiles.items.${id} must be an object with a name`] };
    }
    items[id] = { name: entry.name };
  }
  return { ok: true, activeProfileId: profiles.activeProfileId, items };
}

function withProfiles(config, activeProfileId, items) {
  return { ...config, profiles: { activeProfileId, items } };
}

function fail(errors) {
  return { ok: false, errors: [...errors] };
}

/**
 * Adds missing built-ins idempotently, keeping user profiles and active id. Never mutates input.
 * @param {object} config - Sanitized config.
 * @returns {{ok: boolean, config?: object, added?: string[], errors: string[]}} Next config or errors.
 */
export function ensureBuiltInProfiles(config) {
  const read = readProfiles(config);
  if (!read.ok) return fail(read.errors);
  const items = { ...read.items };
  const added = [];
  for (const preset of BUILT_IN_PROFILES) {
    if (items[preset.id] === undefined) {
      items[preset.id] = { name: preset.name };
      added.push(preset.id);
    }
  }
  return { ok: true, config: withProfiles(config, read.activeProfileId, items), added, errors: [] };
}

/**
 * Adds one user profile without moving the active id. Never mutates input.
 * @param {object} config - Sanitized config.
 * @param {unknown} request - Candidate with id and name.
 * @returns {{ok: boolean, config?: object, errors: string[]}} Next config or errors.
 */
export function createProfile(config, request) {
  const read = readProfiles(config);
  if (!read.ok) return fail(read.errors);
  const id = trimmedOrEmpty(request?.id);
  const name = trimmedOrEmpty(request?.name);
  if (id === '') return fail(['profile id must be a non-empty string']);
  if (name === '') return fail(['profile name must be a non-empty string']);
  if (read.items[id] !== undefined) return fail([`profile "${id}" already exists`]);
  return {
    ok: true,
    config: withProfiles(config, read.activeProfileId, { ...read.items, [id]: { name } }),
    errors: [],
  };
}

/**
 * Renames display name only so stable ids keep references intact.
 * @param {object} config - Sanitized config.
 * @param {unknown} id - Profile id.
 * @param {unknown} name - Next display name.
 * @returns {{ok: boolean, config?: object, errors: string[]}} Next config or errors.
 */
export function renameProfile(config, id, name) {
  const read = readProfiles(config);
  if (!read.ok) return fail(read.errors);
  const key = trimmedOrEmpty(id);
  const nextName = trimmedOrEmpty(name);
  if (read.items[key] === undefined) return fail([`unknown profile "${key}"`]);
  if (nextName === '') return fail(['profile name must be a non-empty string']);
  return {
    ok: true,
    config: withProfiles(config, read.activeProfileId, { ...read.items, [key]: { name: nextName } }),
    errors: [],
  };
}

/**
 * Removes an idle profile; refuses active id and last entry. Never mutates input.
 * @param {object} config - Sanitized config.
 * @param {unknown} id - Profile id.
 * @returns {{ok: boolean, config?: object, errors: string[]}} Next config or errors.
 */
export function removeProfile(config, id) {
  const read = readProfiles(config);
  if (!read.ok) return fail(read.errors);
  const key = trimmedOrEmpty(id);
  if (read.items[key] === undefined) return fail([`unknown profile "${key}"`]);
  if (key === read.activeProfileId) {
    return fail([`cannot remove the active profile "${key}", switch first`]);
  }
  if (Object.keys(read.items).length <= 1) {
    return fail(['must keep at least one profile']);
  }
  const items = { ...read.items };
  delete items[key];
  return { ok: true, config: withProfiles(config, read.activeProfileId, items), errors: [] };
}

/**
 * Points activeProfileId at an existing entry without rewriting sections.
 * @param {object} config - Sanitized config.
 * @param {unknown} id - Profile id.
 * @returns {{ok: boolean, config?: object, errors: string[]}} Next config or errors.
 */
export function switchActiveProfile(config, id) {
  const read = readProfiles(config);
  if (!read.ok) return fail(read.errors);
  const key = trimmedOrEmpty(id);
  if (read.items[key] === undefined) return fail([`unknown profile "${key}"`]);
  return { ok: true, config: withProfiles(config, key, { ...read.items }), errors: [] };
}
