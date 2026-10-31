/**
 * cloverWake — fuzzy "Hey Clover" matcher + tiny event bus shared by the
 * always-on wake listener and every Clover orb.
 */

const ENABLED_KEY = 'clover_wake_word';

// The wake phrase is the whole greeting — "Hey Clover" — never the bare name, so
// the always-on listener can't fire on her name drifting past in ordinary speech.
const PHRASES = ['hey clover', 'hi clover', 'yo clover', 'ok clover', 'okay clover', 'hello clover', 'hey clo'];
const GREETINGS = new Set(['hey', 'hay', 'hei', 'hi', 'hye', 'yo', 'ok', 'okay', 'hello', 'hullo']);
// The engine ran greeting and name together: "heyclover".
const GLUED = /^(hey|hay|hei|hi|hye|yo|okay|ok|hello|hullo)(.+)$/;
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

/** A greeting word, including the near-misses engines produce for "hey". */
function isGreeting(word) {
  return GREETINGS.has(word) || (word.length === 3 && levenshtein(word, 'hey') <= 1);
}

/** Does a clover-ish word begin at words[i]? */
function saysClover(words, i) {
  const w = words[i];
  if (w.length >= 5 && levenshtein(w, SINGLE) <= 2) return true;
  if (PHONETIC.test(w)) return true;
  // Split recognitions like "clo ver" / "clove er"
  return i + 1 < words.length && levenshtein(w + words[i + 1], SINGLE) <= 1;
}

export function matchesWakeWord(text) {
  const t = normalizeTranscript(text);
  if (!t) return false;
  if (PHRASES.some((p) => ` ${t} `.includes(` ${p} `))) return true;

  const words = t.split(' ');
  // The name only wakes her when a greeting leads into it — "hey clover",
  // "hey there clover" — never on its own.
  for (let i = 1; i < words.length; i++) {
    if (!saysClover(words, i)) continue;
    if (isGreeting(words[i - 1]) || (i > 1 && isGreeting(words[i - 2]))) return true;
  }
  for (const w of words) {
    const glued = w.match(GLUED);
    if (glued && saysClover([glued[2]], 0)) return true;
  }
  return false;
}

// ── Enabled flag ────────────────────────────────────────────────────────────
// On by default — hands-free "Hey Clover" is the point of the field kit. Only an
// explicit off (the Settings toggle, or a mic the browser blocked) stops her.
export function isWakeEnabled() {
  try { return localStorage.getItem(ENABLED_KEY) !== '0'; } catch { return true; }
}

export function setWakeEnabled(on) {
  try { localStorage.setItem(ENABLED_KEY, on ? '1' : '0'); } catch { /* private mode */ }
  emit('enabled', on);
}

// ── How her ears decide (Settings → "Hey Clover") ───────────────────────────
const NOISE_KEY = 'clover_noise_gate';
const VOICE_LOCK_KEY = 'clover_voice_lock';

function readFlag(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === '1';
  } catch { return fallback; }
}

function writeFlag(key, on) {
  try { localStorage.setItem(key, on ? '1' : '0'); } catch { /* private mode */ }
}

/** Reject wakes that are only background noise rather than a spoken phrase. */
export function isNoiseGateEnabled() { return readFlag(NOISE_KEY, true); }
export function setNoiseGateEnabled(on) {
  writeFlag(NOISE_KEY, on);
  emit('ears', { noiseGate: !!on, voiceLock: isVoiceLockEnabled() });
}

/** Reject wakes spoken in a voice other than the enrolled one. */
export function isVoiceLockEnabled() { return readFlag(VOICE_LOCK_KEY, true); }
export function setVoiceLockEnabled(on) {
  writeFlag(VOICE_LOCK_KEY, on);
  emit('ears', { noiseGate: isNoiseGateEnabled(), voiceLock: !!on });
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
export function emit(event, payload) {
  listeners.get(event)?.forEach((fn) => {
    try { fn(payload); } catch (err) { console.warn('[cloverWake] listener failed:', err); }
  });
}
export function emitWake() {
  emit('wake');
}
export function emitDenied() {
  emit('denied');
}
/** An utterance was understood and acted on — drives the confirmation popup. */
export function emitCommand(text, kind = 'command') {
  emit('command', { text, kind });
}
/** A wake was heard but turned away: background noise, or another voice. */
export function emitBlocked(reason) {
  emit('blocked', { reason });
}