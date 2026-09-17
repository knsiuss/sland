/**
 * @file Local-first AI actor, emit-only zero-dep (P7 §7.1; ADR-006). Plain text only, no network.
 */

// WHY a bare-specifier dependency, not inlined logic: the task slice mandates
// canonical gate, mirroring apps/desktop/src/main/island/provider-bus.js; the
// module is side-effect-free so no cycle is possible (AGENTS.md §2).
import { shouldDropModuleEvent } from '@max-island/configuration/src/module-gate.js';
// WHY a relative tier import, not inlined matrix: tiers are the ADR-006
// security boundary, pinned in isolation in ai-tier-gate.js (PVR-005,
// AI-SEC-001); this file only consults it, keeping one owner per rule.
import { AI_TIERS, authorizeAiAction } from './ai-tier-gate.js';

export const AI_CATEGORY = 'ai';
// P7 §7.1 payload sanitize: strip HTML, trim, cap length; overlong truncates.
export const AI_ANSWER_MAX_LENGTH = 2000;
// P7 §7.1 event contract: ANSWER transient 60 inside the 4000–8000ms window,
// LISTENING secondary bubble 40/4000ms, PINNED 100/null/sticky on explicit pin.
export const AI_PRIORITY_ANSWER = 60;
export const AI_TIMEOUT_ANSWER_MS = 6000;
export const AI_PRIORITY_LISTENING = 40;
export const AI_TIMEOUT_LISTENING_MS = 4000;
export const AI_PRIORITY_PINNED = 100;
export const AI_TYPE_ANSWER = 'AI.ANSWER_RECEIVED';
export const AI_TYPE_LISTENING = 'AI.LISTENING';
export const AI_TYPE_PINNED = 'AI.PINNED';
// Launcher-only intents map to local deep-link descriptors, never network.
export const AI_LAUNCHER_INTENTS = Object.freeze(['summarize', 'search', 'open-app']);

/**
 * Strips HTML and trims; caps at max length (P7 §7.1).
 * @param {unknown} value - Untrusted text.
 * @returns {{text: string, truncated: boolean} | null} Clean text or null when empty.
 */
function sanitizeText(value) {
  if (typeof value !== 'string') return null;
  const stripped = value.replace(/<[^>]*>/g, '').trim();
  if (stripped === '') return null;
  if (stripped.length > AI_ANSWER_MAX_LENGTH) {
    return { text: stripped.slice(0, AI_ANSWER_MAX_LENGTH), truncated: true };
  }
  return { text: stripped, truncated: false };
}

function resolveNow(now, clock) {
  const at = now === undefined ? clock() : now;
  return typeof at === 'number' && Number.isFinite(at) ? at : null;
}

/**
 * Local-first AI service; launcher works without provider, never sends secrets (P7 §7.1; ADR-006).
 * @param {object} [options] - {config?, getConfig?, emit?, provider?, now?, tier?, getTier?, onAudit?}.
 * @returns {object} {answer, listening, pin, launcherIntent, getCapabilities}.
 */
export function createAIService(options) {
  const { config, getConfig, emit, provider, now, tier, getTier, onAudit } = options ?? {};
  const clock = typeof now === 'function' ? now : typeof now === 'number' ? () => now : () => Date.now();
  const hasProvider = provider !== null && typeof provider === 'object';
  let sequence = 0;

  // ADR-006 tier wiring (additive, AI-SEC-001): tier present as a constructor
  // value, getTier as a live reader, onAudit as a decision sink. Legacy
  // callers pass none of these and never touch the gate below.
  const tierWired = tier !== undefined || typeof getTier === 'function';
  const audit = typeof onAudit === 'function' ? onAudit : null;

  function readTier() {
    if (!tierWired) return null;
    try {
      const live = typeof getTier === 'function' ? getTier() : undefined;
      if (typeof live === 'string' && AI_TIERS.includes(live)) return live;
    } catch {
      // WHY fail-closed off: a throwing tier reader is ambiguous auth state,
      // so the service denies rather than guessing a permissive tier (AI-SEC-001).
      return 'off';
    }
    if (typeof tier === 'string' && AI_TIERS.includes(tier)) return tier;
    // WHY off, not legacy: tier wiring was requested but unresolvable, so the
    // safe direction is deny-all rather than silent legacy behavior (AI-SEC-001).
    return 'off';
  }

  /**
   * Tier verdict for one action; null when legacy unwired (ADR-006). Never throws.
   * @param {string} action - Action name.
   * @param {number} at - Epoch-ms UTC.
   * @returns {object | null} Frozen verdict or null.
   */
  function gateTier(action, at) {
    const active = readTier();
    if (active === null) return null;
    let verdict;
    try {
      // WHY granted hard-coded false: the per-action grant store from ADR-006
      // is future work, so act-tier execution has no grant source yet and
      // denies with needs-grant — fail-closed until grant plumbing lands.
      verdict = authorizeAiAction({ tier: active, action, granted: false });
    } catch {
      verdict = { allowed: false, reason: 'tier-denied' };
    }
    if (audit !== null) {
      try {
        // WHY only tier/action/decision/at: audit entries must never carry
        // content text (AI-SEC-004); the clock edge follows the service pattern.
        audit({ tier: active, action, decision: verdict.allowed ? 'allowed' : 'denied', at });
      } catch {
        // WHY swallow: a throwing audit sink must not break a fail-safe path
        // (deliver() precedent below).
      }
    }
    return verdict;
  }

  function readDisabled() {
    try {
      const active = typeof getConfig === 'function' ? getConfig() : config;
      return shouldDropModuleEvent(active, AI_CATEGORY);
    } catch {
      // WHY fail-open on gate read error: a broken config reader must not
      // brick the assistant; the bus re-gates every event anyway (defense in
      // depth with provider-bus.js shouldDropModuleEvent).
      return false;
    }
  }

  function nextId(at) {
    // WHY local now+seq ids: core forbids Math.random/Date.now sampling, and
    // one cross-package dependency on the gate module is enough — see AGENTS §2.
    sequence += 1;
    return `ai-${at}-${sequence}`;
  }

  function deliver(event) {
    if (typeof emit !== 'function') return false;
    try {
      emit(event);
      return true;
    } catch {
      // WHY swallow: emit failure must not escape a fail-safe path
      // (gsmtc-provider.js reportError precedent).
      return false;
    }
  }

  function buildEvent(kind, at, payload) {
    const spec = kind === 'pinned'
      ? { type: AI_TYPE_PINNED, priority: AI_PRIORITY_PINNED, timeoutMs: null, sticky: true }
      : kind === 'listening'
        ? { type: AI_TYPE_LISTENING, priority: AI_PRIORITY_LISTENING, timeoutMs: AI_TIMEOUT_LISTENING_MS, sticky: false }
        : { type: AI_TYPE_ANSWER, priority: AI_PRIORITY_ANSWER, timeoutMs: AI_TIMEOUT_ANSWER_MS, sticky: false };
    return Object.freeze({
      id: nextId(at),
      ...spec,
      category: AI_CATEGORY,
      timestamp: at,
      payload: Object.freeze({ ...payload }),
      isResolver: true,
    });
  }

  // NOTE (residual, not a failure): AI.* types are pending the phase-2 §2.2
  // doc-first contract extension, so the current bus/reducer drops them as
  // invalid-event fail-safe (SYSTEM.FOREGROUND_CHANGED precedent in
  // provider-bus.js) instead of guessing. Shape matches the P2 envelope so
  // delivery starts working the moment the contract is extended, with zero
  // service change.
  function gated(kind, at, payload) {
    if (readDisabled()) return { delivered: false, reason: 'module-disabled' };
    const event = buildEvent(kind, at, payload);
    if (!deliver(event)) return { delivered: false, reason: 'emit-failed', event };
    return { delivered: true, event };
  }

  return {
    /**
     * Provider chat answer; drops without provider, never networks.
     * @param {unknown} text - Untrusted prompt text.
     * @param {number | Function} [now] - Injected clock.
     * @returns {object} {delivered, event?|reason?}.
     */
    answer(text, now) {
      const at = resolveNow(now, clock);
      if (at === null) return { delivered: false, reason: 'invalid-input' };
      if (readDisabled()) return { delivered: false, reason: 'module-disabled' };
      const answerVerdict = gateTier('answer', at);
      if (answerVerdict !== null && !answerVerdict.allowed) return { delivered: false, reason: answerVerdict.reason };
      const clean = sanitizeText(text);
      if (clean === null) return { delivered: false, reason: 'invalid-input' };
      if (!hasProvider) return { delivered: false, reason: 'no-provider-key' };
      return gated('answer', at, { text: clean.text, truncated: clean.truncated });
    },
    /**
     * Local listening indicator; no provider needed (P7 §7.1).
     * @param {number | Function} [now] - Injected clock.
     * @returns {object} Delivery receipt.
     */
    listening(now) {
      const at = resolveNow(now, clock);
      if (at === null) return { delivered: false, reason: 'invalid-input' };
      const listeningVerdict = gateTier('listening', at);
      if (listeningVerdict !== null && !listeningVerdict.allowed) return { delivered: false, reason: listeningVerdict.reason };
      return gated('listening', at, {});
    },
    /**
     * Explicit user pin to sticky state; local only.
     * @param {unknown} text - Untrusted text.
     * @param {number | Function} [now] - Injected clock.
     * @returns {object} Delivery receipt.
     */
    pin(text, now) {
      const at = resolveNow(now, clock);
      if (at === null) return { delivered: false, reason: 'invalid-input' };
      if (readDisabled()) return { delivered: false, reason: 'module-disabled' };
      const pinVerdict = gateTier('pin', at);
      if (pinVerdict !== null && !pinVerdict.allowed) return { delivered: false, reason: pinVerdict.reason };
      const clean = sanitizeText(text);
      if (clean === null) return { delivered: false, reason: 'invalid-input' };
      return gated('pinned', at, { text: clean.text, truncated: clean.truncated });
    },
    /**
     * Launcher intent to frozen deep-link; unknown kinds drop, never throws.
     * @param {string} kind - summarize|search|open-app.
     * @param {unknown} detail - Untrusted detail, capped.
     * @returns {object} Deep-link descriptor or drop reason.
     */
    launcherIntent(kind, detail) {
      if (readDisabled()) return { delivered: false, reason: 'module-disabled' };
      if (!AI_LAUNCHER_INTENTS.includes(kind)) return { delivered: false, reason: 'unknown-intent' };
      const launcherVerdict = gateTier('launcher', clock());
      if (launcherVerdict !== null && !launcherVerdict.allowed) return { delivered: false, reason: launcherVerdict.reason };
      const clean = typeof detail === 'string' ? detail.replace(/<[^>]*>/g, '').trim() : '';
      // WHY reuse AI_ANSWER_MAX_LENGTH: launcher detail rides the same local
      // descriptor path as answers (P7 §7.1 sanitize) — overlong detail caps
      // instead of growing the bus payload (additive truncated flag only).
      const capped = clean.length > AI_ANSWER_MAX_LENGTH;
      const value = capped ? clean.slice(0, AI_ANSWER_MAX_LENGTH) : clean;
      if (kind === 'search') {
        return capped
          ? Object.freeze({ type: 'deep-link', intent: kind, query: value, truncated: true })
          : Object.freeze({ type: 'deep-link', intent: kind, query: value });
      }
      if (kind === 'open-app') {
        return capped
          ? Object.freeze({ type: 'deep-link', intent: kind, appId: value, truncated: true })
          : Object.freeze({ type: 'deep-link', intent: kind, appId: value });
      }
      return Object.freeze({ type: 'deep-link', intent: kind });
    },
    /**
     * Introspection only; tier- and flag-aware (ADR-006). Never touches network.
     * @returns {object} {chat, launcher, reason}.
     */
    getCapabilities() {
      if (tierWired) {
        const active = readTier();
        if (active === 'off') return { chat: false, launcher: false, reason: 'tier-off' };
        if (readDisabled()) return { chat: false, launcher: true, reason: 'module-disabled' };
        if (active === 'observe') return { chat: false, launcher: true, reason: 'tier-observe' };
        if (active === 'suggest') return { chat: hasProvider, launcher: true, reason: 'tier-suggest' };
        return { chat: hasProvider, launcher: true, reason: 'tier-act' };
      }
      if (readDisabled()) return { chat: false, launcher: true, reason: 'module-disabled' };
      if (hasProvider) return { chat: true, launcher: true, reason: 'provider-configured' };
      return { chat: false, launcher: true, reason: 'no-provider-key' };
    },
  };
}
