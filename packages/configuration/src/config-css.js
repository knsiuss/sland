/**
 * @file Theme tokens to CSS vars so preview and island never drift (P5 §5.1). Pure, no DOM.
 */
import { DEFAULT_ISLAND_CONFIG } from './island-config.js';
export const CONFIG_WRITE_DEBOUNCE_MS_MIN = 100; // P5 §5.1 + §5.2: slider debounce floor
export const CONFIG_WRITE_DEBOUNCE_MS_MAX = 200; // P5 §5.1 + §5.2: slider debounce ceiling
const DEBOUNCED_LEAVES = new Set(['transparency', 'radius', 'accent', 'customsize', 'custom']);
/**
 * Maps sanitized config to CSS vars, defaulting field by field. Never throws.
 * @param {unknown} config - Sanitized IslandConfig (tolerates raw input).
 * @returns {object} Vars for accent, opacity, radius, and animation.
 */
export function configToCssVars(config) {
  const fallback = DEFAULT_ISLAND_CONFIG.appearance;
  const appearance = config !== null && typeof config === 'object' && config.appearance !== null && typeof config.appearance === 'object' ? config.appearance : {};
  const accent = typeof appearance.accent === 'string' ? appearance.accent : fallback.accent;
  const transparency = typeof appearance.transparency === 'number' && Number.isFinite(appearance.transparency) ? appearance.transparency : fallback.transparency;
  const radius = typeof appearance.radius === 'number' && Number.isFinite(appearance.radius) ? Math.floor(appearance.radius) : fallback.radius;
  const animation = typeof appearance.animation === 'string' ? appearance.animation : fallback.animation;
  return { '--accent': accent, '--island-opacity': String(transparency), '--island-radius': `${radius}px`, '--island-anim': animation };
}
/**
 * Resolves effective light/dark; system theme backs unknown values. Never throws.
 * @param {unknown} config - Sanitized IslandConfig (tolerates raw input).
 * @param {unknown} systemDark - System dark flag.
 * @returns {string} Resolved scheme.
 */
export function resolveColorScheme(config, systemDark) {
  const theme = config !== null && typeof config === 'object' && config.appearance !== null && typeof config.appearance === 'object' ? config.appearance.theme : undefined;
  if (theme === 'light') return 'light';
  if (theme === 'dark') return 'dark';
  return systemDark === true ? 'dark' : 'light';
}
/**
 * True for high-frequency slider/drag keys needing debounced writes. Never throws.
 * @param {unknown} key - Settings key path.
 * @returns {boolean} True when the caller must debounce.
 */
export function shouldDebounceWrite(key) {
  if (typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed === '') return false;
  const leaf = trimmed.split('.').pop().toLowerCase();
  return DEBOUNCED_LEAVES.has(leaf);
}
