/**
 * leveling.js — single source of truth for the XP → level → title ladder.
 * Shared by Profile, PlayerLegend, and any surface that shows rank.
 */

export const LEVEL_TITLES = [
  'Pebble Scout',
  'Crystal Apprentice',
  'Geode Guardian',
  'Titan Rockhound',
  'Legendary Specimen Hunter',
  'Mythic Earth Wizard',
];

export const XP_PER_LEVEL = 1200;

/** Returns 1-based level for a given total XP (clamped to max level). */
export function getLevel(xp) {
  return Math.min(Math.floor(xp / XP_PER_LEVEL) + 1, LEVEL_TITLES.length);
}

/** Returns the title for a 1-based level (clamped). */
export function getTitle(level) {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

/** Progress percentage within the current level (0–100). */
export function xpProgress(xp) {
  return ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
}

/** XP remaining to reach the next level (0 if maxed). */
export function xpToNext(xp) {
  const level = getLevel(xp);
  if (level >= LEVEL_TITLES.length) return 0;
  return level * XP_PER_LEVEL - xp;
}