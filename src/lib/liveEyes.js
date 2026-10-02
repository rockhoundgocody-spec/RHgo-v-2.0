/**
 * liveEyes — decides WHEN Live Specimen Eyes should spend an AI call.
 *
 * The camera is sampled into a tiny grayscale thumbnail a few times a second.
 * A classification only runs when the hunter is holding the phone steady on
 * something new, the light is usable, the previous call has finished, and the
 * session budget allows it. That keeps the overlay responsive without
 * streaming every frame to the cloud.
 *
 * Pure functions — no DOM — so the policy is unit-tested.
 */

export const THUMB = 32;                 // thumbnail edge, px
export const STEADY_DIFF = 7;            // mean abs luma diff (0-255) that counts as "still"
export const STEADY_MS = 650;            // how long it must stay still
export const SCENE_CHANGE_DIFF = 14;     // how different from the last classified frame counts as "new"
export const MIN_GAP_MS = 3500;          // never classify more often than this
export const BUDGET = { calls: 24, windowMs: 10 * 60 * 1000 };
export const DARK_LUMA = 38;
export const BRIGHT_LUMA = 235;
/** On-screen aiming square, as a fraction of the camera view's width (the reticle on /scan). */
export const RETICLE_FRACTION = 0.62;

/** Mean luma (0-255) of an RGBA pixel buffer. */
export function lumaOf(rgba) {
  let sum = 0;
  const n = rgba.length / 4;
  for (let i = 0; i < rgba.length; i += 4) {
    sum += 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
  }
  return n ? sum / n : 0;
}

/** RGBA buffer → Uint8Array of luma values. */
export function toGray(rgba) {
  const out = new Uint8Array(rgba.length / 4);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j++) {
    out[j] = (0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2]) | 0;
  }
  return out;
}

/** Mean absolute difference between two gray thumbnails (0-255). */
export function frameDiff(a, b) {
  if (!a || !b || a.length !== b.length || !a.length) return 255;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}

export function lightingOf(luma) {
  if (luma < DARK_LUMA) return 'dark';
  if (luma > BRIGHT_LUMA) return 'glare';
  return 'ok';
}

/** Calls still allowed in the rolling budget window. */
export function budgetLeft(callTimes, now, budget = BUDGET) {
  const recent = callTimes.filter((t) => now - t < budget.windowMs).length;
  return Math.max(0, budget.calls - recent);
}

/**
 * The whole policy in one place.
 * @returns {{ go: boolean, reason: string }}
 */
export function shouldClassify({
  now, steadySince, busy, lastCallAt, lighting, sceneDiff, callTimes, hidden,
}) {
  if (hidden) return { go: false, reason: 'hidden' };
  if (busy) return { go: false, reason: 'busy' };
  if (lighting !== 'ok') return { go: false, reason: lighting };
  if (steadySince == null || now - steadySince < STEADY_MS) return { go: false, reason: 'moving' };
  if (lastCallAt != null && now - lastCallAt < MIN_GAP_MS) return { go: false, reason: 'cooldown' };
  if (lastCallAt != null && sceneDiff < SCENE_CHANGE_DIFF) return { go: false, reason: 'same-scene' };
  if (budgetLeft(callTimes, now) <= 0) return { go: false, reason: 'budget' };
  return { go: true, reason: 'ready' };
}

/** What to tell the hunter right now. */
export function hintFor({ reason, quality, candidates }) {
  if (reason === 'daily') return 'Today’s live labels are used up — tap the shutter to identify';
  if (reason === 'dark' || quality === 'dark') return 'More light — try the torch';
  if (reason === 'glare' || quality === 'glare') return 'Too much glare — tilt the specimen';
  if (quality === 'blurry') return 'Hold steady — it’s blurry';
  if (quality === 'too_far') return 'Move closer — fill the frame';
  if (reason === 'budget') return 'Live labels paused — tap the shutter to identify';
  if (reason === 'moving' && !candidates?.length) return 'Hold steady on a specimen';
  if (!candidates?.length && reason === 'same-scene') return 'Nothing identifiable yet — try another angle';
  return null;
}

/** Reasons worth showing the hunter; every other reason clears the hint. */
export const HINT_REASONS = new Set(['dark', 'glare', 'moving', 'same-scene', 'budget', 'daily']);

/**
 * Debounce the reason the overlay shows: a new reason must repeat for
 * `ticks` consecutive samples before it replaces the shown one, so the hint
 * doesn't flicker while a hand hovers around the steadiness threshold.
 * @param {{ shown: string|null, pending: string|null, count: number }} state
 */
export function settleReason(state, reason, ticks = 2) {
  const next = HINT_REASONS.has(reason) ? reason : null;
  if (next === state.shown) return { shown: state.shown, pending: next, count: 0 };
  const count = next === state.pending ? state.count + 1 : 1;
  if (count >= ticks) return { shown: next, pending: next, count: 0 };
  return { shown: state.shown, pending: next, count };
}

/** Keep only confident, well-formed candidates; best first. */
export function cleanCandidates(raw) {
  const rarities = new Set(['common', 'uncommon', 'rare', 'legendary']);
  return (Array.isArray(raw) ? raw : [])
    .filter((c) => c && typeof c.name === 'string' && c.name.trim())
    .map((c) => ({
      name: c.name.trim().slice(0, 60),
      confidence: Math.max(0, Math.min(1, Number(c.confidence) || 0)),
      rarity: rarities.has(c.rarity) ? c.rarity : 'common',
    }))
    .filter((c) => c.confidence >= 0.3)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

/**
 * The part of the video frame under the on-screen aiming square.
 * The <video> uses object-fit: cover, so what's visible is a centred crop of
 * the frame scaled by max(viewW / videoW, viewH / videoH). Only the aiming
 * square is sent, which keeps the upload small and leaves the hunter's
 * surroundings out of it.
 * @returns {{ sx: number, sy: number, size: number }} square source rect, video px
 */
export function coverCrop({ videoW, videoH, viewW, viewH, fraction = RETICLE_FRACTION }) {
  const vw = Math.max(0, Number(videoW) || 0);
  const vh = Math.max(0, Number(videoH) || 0);
  const minSide = Math.min(vw, vh);
  if (!minSide) return { sx: 0, sy: 0, size: 0 };
  let size = minSide;
  if (viewW > 0 && viewH > 0) {
    const scale = Math.max(viewW / vw, viewH / vh);
    size = Math.min(minSide, (fraction * viewW) / scale);
  }
  size = Math.max(1, Math.round(size));
  return { sx: Math.round((vw - size) / 2), sy: Math.round((vh - size) / 2), size };
}

/** One sentence for screen readers about the current best guess. */
export function describeTop(candidates) {
  const top = candidates?.[0];
  if (!top) return '';
  const pct = Math.round((Number(top.confidence) || 0) * 100);
  const rare = top.rarity && top.rarity !== 'common' ? `, ${top.rarity}` : '';
  return `Looks like ${top.name}, ${pct} percent sure${rare}.`;
}
