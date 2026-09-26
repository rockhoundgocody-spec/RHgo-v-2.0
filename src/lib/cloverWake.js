/**
 * cloverWake — fuzzy "Hey Clover" matcher + tiny event bus shared by the
 * always-on wake listener and every Clover orb.
 */

const ENABLED_KEY = 'clover_wake_word';

const PHRASES = ['hey clover', 'hi clover', 'yo clover', 'ok clover', 'okay clover', 'hello clover', 'hey clo'];
const SINGLE = 'clover';
// Any "cl/kl/gl + vowel(s) + v/b/w + vowel? + r" word: clover, clever, claver, cluver, glover, klovr, cleaver…
const PHONETIC = /\b[ckg]l[aeiouy]{1,2}(v|b|w|ff)[aeiouy]?r+s?\b/;

export function normalizeTranscript(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let last = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
      last = tmp;
    }
  }
  return prev[b.length];
}

export function matchesWakeWord(text) {
  const t = normalizeTranscript(text);
  if (!t) return false;
  if (PHRASES.some((p) => ` ${t} `.includes(` ${p} `))) return true;
  if (PHONETIC.test(t)) return true;

  const words = t.split(' ');
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w.length >= 5 && levenshtein(w, SINGLE) <= 2) return true;
    if (i + 1 < words.length) {
      const pair = `${w} ${words[i + 1]}`;
      if (PHRASES.some((p) => p.length >= 8 && levenshtein(pair, p) <= 2)) return true;
    }
    // Split recognitions like "clo ver" / "clove er"
    if (i + 1 < words.length && levenshtein(w + words[i + 1], SINGLE) <= 1) return true;
  }
  return false;
}

// ── Enabled flag ────────────────────────────────────────────────────────────
export function isWakeEnabled() {
  try { return localStorage.getItem(ENABLED_KEY) === '1'; } catch { return false; }
}

export function setWakeEnabled(on) {
  try { localStorage.setItem(ENABLED_KEY, on ? '1' : '0'); } catch { /* private mode */ }
  emit('enabled', on);
}

// ── Busy tracking: pause the wake listener while Clover talks/listens ─────
const busyIds = new Set();
export function setCloverBusy(id, busy) {
  const before = busyIds.size > 0;
  if (busy) busyIds.add(id); else busyIds.delete(id);
  const after = busyIds.size > 0;
  if (before !== after) emit('busy', after);
}
export function isCloverBusy() {
  return busyIds.size > 0;
}

// ── Bus ─────────────────────────────────────────────────────────────────────
const listeners = new Map();
export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => listeners.get(event)?.delete(fn);
}
function emit(event, payload) {
  listeners.get(event)?.forEach((fn) => fn(payload));
}
export function emitWake() {
  emit('wake');
}
export function emitDenied() {
  emit('denied');
}