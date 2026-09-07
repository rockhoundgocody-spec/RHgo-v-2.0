/**
 * Feature progression — keep the first session simple, then unlock wings
 * of the app as the player ranks up. Visiting an unlocked wing is a
 * "crawl": a bragging-right stamp, not a hidden dark-pattern timer.
 *
 * Levels come from leveling.js (Pebble Scout → Mythic Earth Wizard).
 * Paid Field Pro is a separate axis and is not mixed into this ladder.
 */
import { getLevel, getTitle, xpToNext, LEVEL_TITLES, XP_PER_LEVEL } from './leveling.js';

export const FEATURES = Object.freeze([
  { id: 'scan', path: '/scan', label: 'Scan', minLevel: 1, core: true, brag: 'You opened the reveal.' },
  { id: 'explore', path: '/explore', label: 'Explore', minLevel: 1, core: true, brag: 'You walked the map.' },
  { id: 'collection', path: '/collection', label: 'GeoDex', minLevel: 1, core: true, brag: 'You started the cabinet.' },
  { id: 'chronolith', path: '/chronolith', label: 'Chronolith', minLevel: 2, crawlXp: 25, brag: 'You sat the Reality Trial.' },
  { id: 'compare', path: '/compare', label: 'Compare', minLevel: 2, crawlXp: 15, brag: 'You set two stones against each other.' },
  { id: 'quests', path: '/quests', label: 'Quests', minLevel: 3, crawlXp: 20, brag: 'You took a field oath.' },
  { id: 'badges', path: '/badges', label: 'Badges', minLevel: 3, crawlXp: 15, brag: 'You opened the medal case.' },
  { id: 'companion', path: '/companion', label: 'Companion', minLevel: 4, crawlXp: 20, brag: 'You met Clover in the field.' },
  { id: 'private-log', path: '/private-log', label: 'Private Log', minLevel: 4, crawlXp: 15, brag: 'You kept a secret notebook.' },
  { id: 'community', path: '/community', label: 'Community', minLevel: 5, crawlXp: 20, brag: 'You stepped into the hall.' },
  { id: 'clubs', path: '/clubs', label: 'Clubs', minLevel: 5, crawlXp: 15, brag: 'You found your chapter.' },
  { id: 'leaderboard', path: '/leaderboard', label: 'Leaderboard', minLevel: 5, crawlXp: 15, brag: 'You checked the standings.' },
  { id: 'expeditions', path: '/expeditions', aliases: ['/expedition'], label: 'Expeditions', minLevel: 6, crawlXp: 25, brag: 'You planned a campaign.' },
  { id: 'market', path: '/market', label: 'Market', minLevel: 6, crawlXp: 20, brag: 'You walked the trading floor.' },
]);

const BY_PATH_DESC = [...FEATURES].sort((a, b) => b.path.length - a.path.length);

export function featureForPath(pathname) {
  if (!pathname) return null;
  return BY_PATH_DESC.find((f) => {
    const paths = [f.path, ...(f.aliases || [])];
    return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  }) || null;
}

export function isFeatureUnlocked(feature, level) {
  if (!feature) return true;
  return Number(level) >= feature.minLevel;
}

export function isPathOpen(pathname, level) {
  return isFeatureUnlocked(featureForPath(pathname), level);
}

export function unlockedFeatures(level) {
  return FEATURES.filter((f) => isFeatureUnlocked(f, level));
}

export function featuresRevealedAt(level) {
  return FEATURES.filter((f) => !f.core && f.minLevel === level);
}

export function nextUnlock(level) {
  return FEATURES.find((f) => f.minLevel > level) || null;
}

export function requiredTitleFor(feature) {
  if (!feature) return getTitle(1);
  return getTitle(feature.minLevel);
}

export function crawlScore(crawledIds) {
  const ids = new Set(crawledIds || []);
  const crawlable = FEATURES.filter((f) => !f.core);
  const crawled = crawlable.filter((f) => ids.has(f.id)).length;
  return { crawled, total: crawlable.length };
}

export function buildUnlockHint({ xp, feature }) {
  if (!feature) return null;
  const level = getLevel(xp);
  if (level >= feature.minLevel) return null;
  const xpNeeded = Math.max(0, (feature.minLevel - 1) * XP_PER_LEVEL - (xp || 0));
  return {
    feature,
    title: requiredTitleFor(feature),
    xpNeeded,
    remainingToNextLevel: xpToNext(xp || 0),
    playerLevel: level,
    playerTitle: getTitle(level),
    maxTitle: LEVEL_TITLES[LEVEL_TITLES.length - 1],
  };
}

export function xpNeededForLevel(level, xp) {
  const target = Math.max(1, Math.min(level, LEVEL_TITLES.length));
  const threshold = (target - 1) * XP_PER_LEVEL;
  return Math.max(0, threshold - (xp || 0));
}

export { getLevel, getTitle, xpToNext, LEVEL_TITLES };
