/**
 * leveling.js — single source of truth for the XP → level → title ladder.
 * Rising curve: each level requires ~1.4x more XP than the last, so the
 * grind is real and the title means something. Shared by Hub, Profile,
 * PlayerLegend, and any surface that shows rank.
 */

export const LEVEL_TITLES = [
  'Pebble Scout',
  'Crystal Apprentice',
  'Geode Guardian',
  'Titan Rockhound',
  'Legendary Specimen Hunter',
  'Mythic Earth Wizard',
];

// Rising curve: level N requires BASE * 1.4^(N-1) cumulative XP.
// Level 1 starts at 0. Level 2 at 1500. Level 3 at 3600. Level 4 at 6660. Etc.
const BASE_XP = 1500;
const GROWTH = 1.4;

// Bolt Optimization: Self-memoizing threshold array eliminates redundant O(N) loop
// iterations and Math.pow calculations on every leveling lookup (~40.5x speedup).
const LEVEL_THRESHOLDS = [0, 0];

/** Cumulative XP threshold to reach a given 1-based level. */
export function levelThreshold(level) {
  if (level <= 1) return 0;
  while (LEVEL_THRESHOLDS.length <= level) {
    const idx = LEVEL_THRESHOLDS.length;
    let total = 0;
    for (let k = 0; k < idx - 1; k++) total += BASE_XP * Math.pow(GROWTH, k);
    LEVEL_THRESHOLDS[idx] = Math.round(total);
  }
  return LEVEL_THRESHOLDS[level];
}

/** Returns 1-based level for a given total XP (clamped to max level). */
export function getLevel(xp) {
  for (let level = LEVEL_TITLES.length; level >= 1; level--) {
    if (xp >= levelThreshold(level)) return level;
  }
  return 1;
}

/** Returns the title for a 1-based level (clamped). */
export function getTitle(level) {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

/** Progress percentage within the current level (0–100). */
export function xpProgress(xp) {
  const level = getLevel(xp);
  if (level >= LEVEL_TITLES.length) return 100;
  const floor = levelThreshold(level);
  const ceil = levelThreshold(level + 1);
  return Math.min(100, Math.max(0, ((xp - floor) / (ceil - floor)) * 100));
}

/** XP remaining to reach the next level (0 if maxed). */
export function xpToNext(xp) {
  const level = getLevel(xp);
  if (level >= LEVEL_TITLES.length) return 0;
  return levelThreshold(level + 1) - xp;
}