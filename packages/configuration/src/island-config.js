/**
 * @file Versioned config schema so corrupt stores default instead of crashing boot (P5 §5.1). Pure zero-dep.
 */
export const CONFIG_VERSION = 1;
const THEMES = ['system', 'light', 'dark'];
const SIZES = ['compact', 'comfortable', 'large', 'custom'];
const ANIMS = ['spring', 'fade', 'none'];
const PRESETS = ['top-center', 'top-left', 'top-right', 'custom'];
const WORKSPACES = ['current-only', 'all-workspaces'];
const FULLSCREENS = ['hide', 'overlay', 'minimize'];
const ACCENT_RE = /^#[0-9a-fA-F]{6}$/;
const TOP_KEYS = ['configVersion', 'appearance', 'position', 'modules', 'behavior', 'profiles'];
const BANNER = 'Settings were reset to defaults because the config file was corrupt. A backup was kept.';
export const DEFAULT_ISLAND_CONFIG = Object.freeze({
  configVersion: 1,
  appearance: Object.freeze({ theme: 'system', accent: '#ff4d5a', transparency: 0.92, blur: false, size: 'comfortable', customSize: Object.freeze({ width: 420, height: 64 }), radius: 22, animation: 'spring' }),
  position: Object.freeze({ preset: 'top-center', custom: Object.freeze({ x: 760, y: 12 }), monitor: 'primary' }),
  modules: Object.freeze({ pomodoro: true, music: true, notification: true, download: false, microphone: false, ai: false }),
  behavior: Object.freeze({ autoHide: true, autoHideIdleSeconds: 5, expandOnHover: true, keepOnTop: true, workspaceBehavior: 'all-workspaces', fullscreenBehavior: 'overlay' }),
  profiles: Object.freeze({ activeProfileId: 'default', items: Object.freeze({ default: Object.freeze({ name: 'Default' }) }) }),
});
function isObj(v) { if (v === null || typeof v !== 'object' || Array.isArray(v)) return false; const p = Object.getPrototypeOf(v); return p === Object.prototype || p === null; }
function isNum(v) { return typeof v === 'number' && Number.isFinite(v); }
function cloneDefaults() {
  return { configVersion: 1, appearance: { theme: 'system', accent: '#ff4d5a', transparency: 0.92, blur: false, size: 'comfortable', customSize: { width: 420, height: 64 }, radius: 22, animation: 'spring' }, position: { preset: 'top-center', custom: { x: 760, y: 12 }, monitor: 'primary' }, modules: { pomodoro: true, music: true, notification: true, download: false, microphone: false, ai: false }, behavior: { autoHide: true, autoHideIdleSeconds: 5, expandOnHover: true, keepOnTop: true, workspaceBehavior: 'all-workspaces', fullscreenBehavior: 'overlay' }, profiles: { activeProfileId: 'default', items: { default: { name: 'Default' } } } };
}
function stripUnknown(src, allowed, scope, warnings) { for (const k of Object.keys(src)) if (!allowed.includes(k)) warnings.push(`unknown key "${scope}${k}" stripped`); }
function asEnum(v, allowed, fb, field, errors) { if (typeof v !== 'string' || !allowed.includes(v)) { errors.push(`${field} must be one of ${allowed.join('|')}, defaulted`); return fb; } return v; }
function asBool(v, fb, field, errors) { if (typeof v === 'boolean') return v; if (v === undefined) return fb; errors.push(`${field} must be a boolean, defaulted`); return fb; }
function appearanceOf(raw, errors, warnings) {
  const out = { theme: 'system', accent: '#ff4d5a', transparency: 0.92, blur: false, size: 'comfortable', customSize: { width: 420, height: 64 }, radius: 22, animation: 'spring' };
  if (raw === undefined) return out;
  if (!isObj(raw)) { errors.push('appearance must be an object, defaulted'); return out; }
  stripUnknown(raw, ['theme', 'accent', 'transparency', 'blur', 'size', 'customSize', 'radius', 'animation'], 'appearance.', warnings);
  if (raw.theme !== undefined) out.theme = asEnum(raw.theme, THEMES, out.theme, 'appearance.theme', errors);
  if (raw.accent !== undefined) { if (typeof raw.accent === 'string' && ACCENT_RE.test(raw.accent)) out.accent = raw.accent; else errors.push('appearance.accent must match ^#[0-9a-fA-F]{6}$, defaulted'); }
  if (raw.transparency !== undefined) { if (typeof raw.transparency === 'symbol' || !isNum(raw.transparency)) errors.push('appearance.transparency must be a finite number, defaulted'); else if (raw.transparency < 0.4 || raw.transparency > 1.0) errors.push('appearance.transparency out of range 0.4-1.0, defaulted'); else out.transparency = raw.transparency; } // P5 §5.1: range 0.4-1.0
  if (raw.blur !== undefined) out.blur = asBool(raw.blur, out.blur, 'appearance.blur', errors);
  if (raw.size !== undefined) out.size = asEnum(raw.size, SIZES, out.size, 'appearance.size', errors);
  if (raw.customSize !== undefined) {
    if (!isObj(raw.customSize)) errors.push('appearance.customSize must be an object, defaulted');
    else { stripUnknown(raw.customSize, ['width', 'height'], 'appearance.customSize.', warnings); for (const f of ['width', 'height']) { const v = raw.customSize[f]; if (v === undefined) continue; if (typeof v === 'symbol' || !isNum(v) || Math.floor(v) <= 0) errors.push(`appearance.customSize.${f} must be a positive integer, defaulted`); else out.customSize[f] = Math.floor(v); } }
  }
  if (raw.radius !== undefined) { if (typeof raw.radius === 'symbol' || !isNum(raw.radius)) errors.push('appearance.radius must be a finite number, defaulted'); else { const r = Math.floor(raw.radius); if (r < 8 || r > 32) errors.push('appearance.radius out of range 8-32, defaulted'); else out.radius = r; } } // P5 §5.1: range 8-32
  if (raw.animation !== undefined) out.animation = asEnum(raw.animation, ANIMS, out.animation, 'appearance.animation', errors);
  return out;
}
function positionOf(raw, errors, warnings) {
  const out = { preset: 'top-center', custom: { x: 760, y: 12 }, monitor: 'primary' };
  if (raw === undefined) return out;
  if (!isObj(raw)) { errors.push('position must be an object, defaulted'); return out; }
  stripUnknown(raw, ['preset', 'custom', 'monitor'], 'position.', warnings);
  if (raw.preset !== undefined) out.preset = asEnum(raw.preset, PRESETS, out.preset, 'position.preset', errors);
  if (raw.custom !== undefined) {
    if (!isObj(raw.custom)) errors.push('position.custom must be an object, defaulted');
    else { stripUnknown(raw.custom, ['x', 'y'], 'position.custom.', warnings); for (const f of ['x', 'y']) { const v = raw.custom[f]; if (v === undefined) continue; if (typeof v === 'symbol' || !isNum(v) || Math.floor(v) < 0) errors.push(`position.custom.${f} must be an integer >= 0, defaulted`); else out.custom[f] = Math.floor(v); } }
  }
  if (raw.monitor !== undefined) { if (typeof raw.monitor !== 'string' || raw.monitor.trim() === '') errors.push('position.monitor must be a non-empty string, defaulted'); else out.monitor = raw.monitor.trim(); }
  return out;
}
function modulesOf(raw, errors, warnings) {
  const out = { pomodoro: true, music: true, notification: true, download: false, microphone: false, ai: false };
  if (raw === undefined) return out;
  if (!isObj(raw)) { errors.push('modules must be an object, defaulted'); return out; }
  for (const k of Object.keys(raw)) if (!Object.keys(out).includes(k)) warnings.push(`unknown key "modules.${k}" stripped`);
  for (const k of Object.keys(out)) { const v = raw[k]; if (v === undefined) continue; if (typeof v !== 'boolean') errors.push(`modules.${k} must be a boolean, defaulted`); else out[k] = v; }
  return out;
}
function behaviorOf(raw, errors, warnings) {
  const out = { autoHide: true, autoHideIdleSeconds: 5, expandOnHover: true, keepOnTop: true, workspaceBehavior: 'all-workspaces', fullscreenBehavior: 'overlay' };
  if (raw === undefined) return out;
  if (!isObj(raw)) { errors.push('behavior must be an object, defaulted'); return out; }
  stripUnknown(raw, ['autoHide', 'autoHideIdleSeconds', 'expandOnHover', 'keepOnTop', 'workspaceBehavior', 'fullscreenBehavior'], 'behavior.', warnings);
  for (const f of ['autoHide', 'expandOnHover', 'keepOnTop']) if (raw[f] !== undefined) out[f] = asBool(raw[f], out[f], `behavior.${f}`, errors);
  if (raw.autoHideIdleSeconds !== undefined) { const v = raw.autoHideIdleSeconds; if (typeof v === 'symbol' || !isNum(v)) errors.push('behavior.autoHideIdleSeconds must be a finite number, defaulted'); else { const s = Math.floor(v); if (s < 3 || s > 60) errors.push('behavior.autoHideIdleSeconds out of range 3-60, defaulted'); else out.autoHideIdleSeconds = s; } } // P5 §5.1: range 3-60
  if (raw.workspaceBehavior !== undefined) out.workspaceBehavior = asEnum(raw.workspaceBehavior, WORKSPACES, out.workspaceBehavior, 'behavior.workspaceBehavior', errors);
  if (raw.fullscreenBehavior !== undefined) out.fullscreenBehavior = asEnum(raw.fullscreenBehavior, FULLSCREENS, out.fullscreenBehavior, 'behavior.fullscreenBehavior', errors);
  return out;
}
function profilesOf(raw, errors, warnings) {
  const out = { activeProfileId: 'default', items: { default: { name: 'Default' } } };
  if (raw === undefined) return out;
  if (!isObj(raw)) { errors.push('profiles must be an object, defaulted'); return out; }
  stripUnknown(raw, ['activeProfileId', 'items'], 'profiles.', warnings);
  if (raw.activeProfileId !== undefined) { if (typeof raw.activeProfileId !== 'string' || raw.activeProfileId.trim() === '') errors.push('profiles.activeProfileId must be a non-empty string, defaulted'); else out.activeProfileId = raw.activeProfileId.trim(); }
  if (raw.items !== undefined) {
    if (!isObj(raw.items)) errors.push('profiles.items must be an object, defaulted');
    else { const next = {}; for (const [id, e] of Object.entries(raw.items)) { if (!isObj(e)) { errors.push(`profiles.items.${id} must be an object, defaulted`); next[id] = { name: id }; continue; } for (const k of Object.keys(e)) if (k !== 'name') warnings.push(`unknown key "profiles.items.${id}.${k}" stripped`); if (typeof e.name !== 'string' || e.name.trim() === '') { errors.push(`profiles.items.${id}.name must be a non-empty string, defaulted`); next[id] = { name: id }; } else next[id] = { name: e.name.trim() }; } if (Object.keys(next).length > 0) out.items = next; else errors.push('profiles.items must keep at least one profile, defaulted'); }
  }
  if (out.items[out.activeProfileId] === undefined) { errors.push('profiles.activeProfileId must name an existing profile, defaulted'); out.activeProfileId = out.items.default !== undefined ? 'default' : Object.keys(out.items)[0]; }
  return out;
}
/**
 * Sanitizes untrusted input collecting every error; unknown keys warn stripped. Never throws.
 * @param {unknown} raw - Untrusted config object.
 * @returns {{config: object, errors: string[], warnings: string[]}} Usable v1 config plus diagnostics.
 */
export function sanitizeIslandConfig(raw) {
  const errors = [];
  const warnings = [];
  if (!isObj(raw)) return { config: cloneDefaults(), errors: ['config must be an object, defaulted'], warnings };
  stripUnknown(raw, TOP_KEYS, '', warnings);
  if (raw.configVersion === undefined) errors.push('configVersion missing, migrated to v1');
  else if (raw.configVersion !== CONFIG_VERSION) { errors.push('unsupported configVersion, expected 1'); return { config: cloneDefaults(), errors, warnings }; }
  return { config: { configVersion: 1, appearance: appearanceOf(raw.appearance, errors, warnings), position: positionOf(raw.position, errors, warnings), modules: modulesOf(raw.modules, errors, warnings), behavior: behaviorOf(raw.behavior, errors, warnings), profiles: profilesOf(raw.profiles, errors, warnings) }, errors, warnings };
}
/**
 * Maps legacy flat input (theme/accent, string position, media aliases) to v1. Never throws.
 * @param {unknown} raw - Legacy config without version.
 * @returns {object} Sanitized v1 config.
 */
export function migrateIslandConfig(raw) {
  if (!isObj(raw)) return cloneDefaults();
  const legacyModules = isObj(raw.modules) ? raw.modules : {};
  const legacyPosition = typeof raw.position === 'string' ? { preset: raw.position } : (isObj(raw.position) ? raw.position : undefined);
  const legacyAppearance = isObj(raw.appearance) ? { ...raw.appearance } : {};
  if (typeof raw.theme === 'string' && legacyAppearance.theme === undefined) legacyAppearance.theme = raw.theme;
  if (typeof raw.accent === 'string' && legacyAppearance.accent === undefined) legacyAppearance.accent = raw.accent;
  const candidate = { configVersion: 1, appearance: legacyAppearance, position: legacyPosition, modules: { pomodoro: legacyModules.pomodoro, music: legacyModules.music ?? legacyModules.media, notification: legacyModules.notification ?? legacyModules.notifications, download: legacyModules.download, microphone: legacyModules.microphone, ai: legacyModules.ai }, behavior: isObj(raw.behavior) ? raw.behavior : undefined, profiles: isObj(raw.profiles) ? raw.profiles : undefined };
  return sanitizeIslandConfig(candidate).config;
}
/**
 * Loads raw file text; parse/version failures yield defaults plus backup banner. Never throws.
 * @param {unknown} text - Raw file text.
 * @returns {{config: object, errors: string[], warnings: string[], needsBackup: boolean, backupReason: string|null, banner: string|null}} Load outcome.
 */
export function loadIslandConfigFromText(text) {
  if (typeof text !== 'string') return { config: cloneDefaults(), errors: ['config text must be a string, defaulted'], warnings: [], needsBackup: true, backupReason: 'invalid-type', banner: BANNER };
  if (text.trim() === '') return { config: cloneDefaults(), errors: ['config file is empty, defaulted'], warnings: [], needsBackup: true, backupReason: 'empty-file', banner: BANNER };
  let parsed;
  try { parsed = JSON.parse(text); } catch { return { config: cloneDefaults(), errors: ['config file is not valid JSON, defaulted'], warnings: [], needsBackup: true, backupReason: 'parse-error', banner: BANNER }; }
  if (!isObj(parsed)) return { config: cloneDefaults(), errors: ['config must be a JSON object, defaulted'], warnings: [], needsBackup: true, backupReason: 'non-object', banner: BANNER };
  if (typeof parsed.configVersion === 'number' && parsed.configVersion > CONFIG_VERSION) return { config: cloneDefaults(), errors: ['unsupported configVersion, expected 1'], warnings: [], needsBackup: true, backupReason: 'future-version', banner: BANNER };
  if (parsed.configVersion === undefined) return { config: migrateIslandConfig(parsed), errors: [], warnings: ['migrated from legacy config to v1'], needsBackup: false, backupReason: null, banner: null };
  const cleaned = sanitizeIslandConfig(parsed);
  return { config: cleaned.config, errors: cleaned.errors, warnings: cleaned.warnings, needsBackup: false, backupReason: null, banner: null };
}
/**
 * Validates import text; fatal problems keep caller config, unknown keys only warn. Never throws.
 * @param {unknown} text - Raw import text.
 * @returns {{ok: boolean, value?: object, errors?: string[], warnings: string[]}} Accepted value or errors.
 */
export function validateConfigImport(text) {
  if (typeof text !== 'string') return { ok: false, errors: ['import text must be a string'], warnings: [] };
  if (text.trim() === '') return { ok: false, errors: ['import file is empty'], warnings: [] };
  let parsed;
  try { parsed = JSON.parse(text); } catch { return { ok: false, errors: ['import file is not valid JSON'], warnings: [] }; }
  if (!isObj(parsed)) return { ok: false, errors: ['import must be a JSON object'], warnings: [] };
  if (typeof parsed.configVersion === 'number' && parsed.configVersion > CONFIG_VERSION) return { ok: false, errors: ['unsupported configVersion, expected 1'], warnings: [] };
  if (parsed.configVersion === undefined) return { ok: true, value: migrateIslandConfig(parsed), warnings: ['migrated from legacy config to v1'] };
  const cleaned = sanitizeIslandConfig(parsed);
  if (cleaned.errors.length > 0) return { ok: false, errors: cleaned.errors, warnings: cleaned.warnings };
  return { ok: true, value: cleaned.config, warnings: cleaned.warnings };
}
