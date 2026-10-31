/**
 * voicePrint — the accuracy layer under the "Hey Clover" wake word.
 *
 * Two jobs, both on-device:
 *   1. A noise gate that learns the room's own noise floor, so a wake is only
 *      accepted when somebody actually spoke above it.
 *   2. A speaker print: band energies with the loudness divided out, so the
 *      enrolled print matches on timbre, not on how close the phone was to
 *      your mouth.
 *
 * Pure math plus localStorage — the wake listener feeds it frames sampled from
 * an AnalyserNode. Unit-tested in voicePrint.test.js; nothing here touches the
 * DOM, the network, or sends audio anywhere.
 */

export const BANDS = 14;

/** A print needs this much real speech before it is worth saving. */
export const MIN_PRINT_FRAMES = 12;
/** Cosine similarity a live utterance must reach against the enrolled print. */
export const VOICE_MATCH_THRESHOLD = 0.66;
/** Share of the utterance window that must clear the noise gate. */
export const SPEECH_FRAME_RATIO = 0.22;
/** Speech is what stands this far above the room's noise floor. */
export const GATE_MARGIN = 2;
/** Below this loudness nothing counts as speech, however quiet the room. */
export const GATE_MIN_LEVEL = 0.05;

export function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/**
 * Byte spectrum → BANDS band energies, mean-removed and unit-normalised.
 * The result is the *shape* of the voice: a quiet and a shouted "Hey Clover"
 * produce the same vector, while two different speakers do not.
 */
export function bandVector(bins) {
  if (!bins || !bins.length) return new Array(BANDS).fill(0);

  // Speech lives above room rumble and below the near-empty top end.
  const from = Math.max(1, Math.floor(bins.length * 0.02));
  const to = Math.max(from + BANDS, Math.floor(bins.length * 0.72));
  const step = (to - from) / BANDS;

  const out = new Array(BANDS);
  let total = 0;
  for (let i = 0; i < BANDS; i++) {
    const start = from + Math.floor(i * step);
    const end = Math.max(start + 1, from + Math.floor((i + 1) * step));
    let sum = 0;
    let n = 0;
    for (let j = start; j < end && j < bins.length; j++) { sum += bins[j]; n += 1; }
    const v = n ? sum / n / 255 : 0;
    out[i] = v;
    total += v;
  }

  const mean = total / BANDS;
  let mag = 0;
  for (let i = 0; i < BANDS; i++) { out[i] -= mean; mag += out[i] * out[i]; }
  mag = Math.sqrt(mag);
  if (mag < 1e-5) return new Array(BANDS).fill(0); // silence has no shape
  for (let i = 0; i < BANDS; i++) out[i] = Math.round((out[i] / mag) * 1e4) / 1e4;
  return out;
}

/** Cosine similarity of two shape vectors, clamped to 0..1. */
export function cosine(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA < 1e-6 || magB < 1e-6) return 0;
  const c = dot / (Math.sqrt(magA) * Math.sqrt(magB));
  return Number.isFinite(c) ? Math.min(1, Math.max(0, c)) : 0;
}

/** Average shape frames into one unit vector, or null when there are too few. */
export function meanVector(frames, min = 1) {
  const kept = (frames || []).filter(
    (f) => Array.isArray(f) && f.length === BANDS && f.some((v) => v)
  );
  if (kept.length < min) return null;

  const out = new Array(BANDS).fill(0);
  for (const frame of kept) for (let i = 0; i < BANDS; i++) out[i] += frame[i];

  let mag = 0;
  for (let i = 0; i < BANDS; i++) { out[i] /= kept.length; mag += out[i] * out[i]; }
  mag = Math.sqrt(mag);
  if (mag < 1e-5) return null;
  for (let i = 0; i < BANDS; i++) out[i] = out[i] / mag;
  return out;
}

/** Several speech frames → a savable print, or null when the sample was thin. */
export function buildPrint(frames) {
  const bands = meanVector(frames, MIN_PRINT_FRAMES);
  if (!bands) return null;
  return { bands, frameCount: (frames || []).length };
}

/** How closely a live utterance matches the enrolled print (0..1). */
export function matchScore(print, frames) {
  const enrolled = Array.isArray(print) ? print : print?.bands;
  if (!enrolled?.length) return 0;
  const live = meanVector(frames, 4);
  if (!live) return 0;
  return cosine(enrolled, live);
}

/**
 * Adaptive room-noise gate. Feed it each loudness frame; it tracks the floor of
 * wherever you are standing and reports whether that frame carried speech.
 *
 * What separates a voice from a creek, a fan or a highway is that a voice
 * *moves*: it swells, lands and fades. So the floor follows loudness down fast,
 * creeps up toward anything that stays flat frame to frame (that's the room),
 * and is left alone while the signal is fluctuating (that's someone talking).
 * That way steady road noise raises the bar, while a voice never raises it on
 * itself and locks the gate shut.
 */
export function createNoiseGate({
  margin = GATE_MARGIN,
  minLevel = GATE_MIN_LEVEL,
  down = 0.2,
  up = 0.04,
  flat = 0.02,
} = {}) {
  let floor = 0.02;
  let previous = null;

  const bar = () => Math.max(minLevel, floor * margin);

  return {
    get floor() { return floor; },
    /** Loudness a frame must reach to count as speech right now. */
    get threshold() { return bar(); },
    /** Feed one 0..1 loudness frame; true when it reads as speech. */
    push(value) {
      const level = clamp01(value);
      const steady = previous !== null && Math.abs(level - previous) < flat;
      if (level < floor) {
        floor += (level - floor) * down;              // quieter here — follow it down
      } else if (steady) {
        floor += (level - floor) * up;                // flat and loud — that's the room
      }
      previous = level;
      return level >= bar();
    },
    /** Would this loudness count as speech against the floor right now? */
    isSpeech(value) { return clamp01(value) >= bar(); },
  };
}

/** Share of a window's frames that carried speech over a given floor. */
export function speechFrameRatio(levels, floor, { margin = GATE_MARGIN, minLevel = GATE_MIN_LEVEL } = {}) {
  const frames = levels || [];
  if (!frames.length) return 0;
  const bar = Math.max(minLevel, (Number(floor) || 0) * margin);
  let hits = 0;
  for (const level of frames) if (clamp01(level) >= bar) hits += 1;
  return hits / frames.length;
}

// ── Storage (local only — the print never leaves the device) ────────────────
const PRINT_KEY = 'clover_voice_print_v1';

function store() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // private mode
  }
}

export function saveVoicePrint(print) {
  if (!print?.bands?.length) return false;
  const s = store();
  if (!s) return false;
  try {
    s.setItem(PRINT_KEY, JSON.stringify({
      version: 1,
      bands: print.bands,
      frames: print.frameCount || 0,
      created: new Date().toISOString(),
    }));
    return true;
  } catch {
    return false;
  }
}

export function loadVoicePrint() {
  const s = store();
  if (!s) return null;
  try {
    const raw = s.getItem(PRINT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.bands) && parsed.bands.length === BANDS ? parsed : null;
  } catch {
    return null;
  }
}

export function clearVoicePrint() {
  const s = store();
  try { s?.removeItem(PRINT_KEY); } catch { /* nothing stored */ }
}

export function hasVoicePrint() {
  return !!loadVoicePrint();
}