// Badge catalog + earning rules. Pure functions — no side effects.

const BADGE_METRICS = Symbol('badgeMetrics');
const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeDayKey(value) {
  if (typeof value !== 'string') return null;
  const key = value.slice(0, 10);
  if (!DAY_KEY_PATTERN.test(key)) return null;
  const timestamp = Date.parse(`${key}T00:00:00Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== key) return null;
  return key;
}

export function computeBadgeMetrics(specimens = []) {
  const list = Array.isArray(specimens) ? specimens : [];
  const mineralCounts = new Map();
  const locationCounts = new Map();
  const rarityCounts = new Map();
  const dayKeys = new Set();
  const confidenceSequence = [];
  let verifiedCount = 0;
  let highConfidenceCount = 0;
  let detailedNotesCount = 0;
  let rareOrLegendaryCount = 0;
  let bestMineralCount = 0;

  list.forEach((specimen, index) => {
    const mineral = (specimen?.mineral_name || '').toLowerCase().trim();
    if (mineral) {
      const nextCount = (mineralCounts.get(mineral) || 0) + 1;
      mineralCounts.set(mineral, nextCount);
      bestMineralCount = Math.max(bestMineralCount, nextCount);
    }

    const location = (specimen?.found_at || '').toLowerCase().trim();
    if (location) locationCounts.set(location, (locationCounts.get(location) || 0) + 1);

    const rarity = specimen?.rarity || 'common';
    rarityCounts.set(rarity, (rarityCounts.get(rarity) || 0) + 1);
    if (rarity === 'rare' || rarity === 'legendary') rareOrLegendaryCount += 1;

    if (specimen?.verified === true) verifiedCount += 1;
    const confidence = Number(specimen?.ai_confidence) || 0;
    if (confidence >= 0.8) highConfidenceCount += 1;
    if ((specimen?.notes || '').length > 20) detailedNotesCount += 1;

    const dayKey = normalizeDayKey(specimen?.found_date || specimen?.created_date);
    if (dayKey) dayKeys.add(dayKey);

    const createdAt = Date.parse(specimen?.created_date || '') || 0;
    confidenceSequence.push({ confidence, createdAt, index });
  });

  const sortedDays = [...dayKeys].sort();
  let currentDayStreak = sortedDays.length ? 1 : 0;
  let maxDayStreak = currentDayStreak;
  for (let i = 1; i < sortedDays.length; i += 1) {
    const previous = Date.parse(`${sortedDays[i - 1]}T00:00:00Z`);
    const current = Date.parse(`${sortedDays[i]}T00:00:00Z`);
    currentDayStreak = current - previous === 86_400_000 ? currentDayStreak + 1 : 1;
    maxDayStreak = Math.max(maxDayStreak, currentDayStreak);
  }

  confidenceSequence.sort((a, b) => a.createdAt - b.createdAt || a.index - b.index);
  let currentConfidenceStreak = 0;
  let maxConfidenceStreak = 0;
  for (const item of confidenceSequence) {
    currentConfidenceStreak = item.confidence >= 0.9 ? currentConfidenceStreak + 1 : 0;
    maxConfidenceStreak = Math.max(maxConfidenceStreak, currentConfidenceStreak);
  }

  return {
    [BADGE_METRICS]: true,
    count: list.length,
    uniqueMineralsCount: mineralCounts.size,
    uniqueLocationsCount: locationCounts.size,
    bestMineralCount,
    verifiedCount,
    highConfidenceCount,
    detailedNotesCount,
    rareOrLegendaryCount,
    maxDayStreak,
    maxConfidenceStreak,
    rarityCounts,
  };
}

function resolveMetrics(input) {
  return input?.[BADGE_METRICS] ? input : computeBadgeMetrics(input);
}

const qualifies = (select, target = 1) => input => select(resolveMetrics(input)) >= target;
const progress = (select, target) => input => ({
  current: Math.min(select(resolveMetrics(input)), target),
  target,
});

// Backward-compatible alias mapping
const ALIASES = {
  first_find: 'crystal_whisperer',
  archivist_25: 'master_of_stone',
  globetrotter: 'cartographer',
  mineralogist: 'crystal_whisperer',
};

export const BADGES = [
  // ── THE 15 LIQUID MINERAL BADGES ─────────────────────────────────────────────
  {
    code: 'crystal_whisperer', title: 'Crystal Whisperer',
    description: 'Find your first rare crystal.',
    rarity: 'common', icon: 'Gem', material: 'liquid_glass', colorScheme: 'amethyst',
    check: qualifies(m => m.count),
    progress: progress(m => m.count, 1),
  },
  {
    code: 'trailblazer', title: 'Trailblazer',
    description: 'Explore 25 sites.',
    rarity: 'uncommon', icon: 'Footprints', material: 'geo_topo', colorScheme: 'copper',
    check: qualifies(m => m.uniqueLocationsCount, 25),
    progress: progress(m => m.uniqueLocationsCount, 25),
  },
  {
    code: 'pathfinder', title: 'Pathfinder',
    description: 'Explore 50 sites.',
    rarity: 'rare', icon: 'Map', material: 'liquid_glass', colorScheme: 'jade',
    check: qualifies(m => m.uniqueLocationsCount, 50),
    progress: progress(m => m.uniqueLocationsCount, 50),
  },
  {
    code: 'master_of_stone', title: 'Master of Stone',
    description: 'Collect 250 specimens.',
    rarity: 'rare', icon: 'Library', material: 'crystal_core', colorScheme: 'violet',
    check: qualifies(m => m.count, 250),
    progress: progress(m => m.count, 250),
  },
  {
    code: 'sharp_eye', title: 'Sharp Eye',
    description: 'Identify 10 rocks correctly.',
    rarity: 'common', icon: 'Eye', material: 'natural_stone', colorScheme: 'teal',
    check: qualifies(m => m.highConfidenceCount, 10),
    progress: progress(m => m.highConfidenceCount, 10),
  },
  {
    code: 'rare_seeker', title: 'Rare Seeker',
    description: 'Find 5 rare specimens.',
    rarity: 'rare', icon: 'Sparkles', material: 'metallic_inlay', colorScheme: 'amber',
    check: qualifies(m => m.rareOrLegendaryCount, 5),
    progress: progress(m => m.rareOrLegendaryCount, 5),
  },
  {
    code: 'shared_adventure', title: 'Shared Adventure',
    description: 'Complete your first family trip.',
    rarity: 'rare', icon: 'Share2', material: 'natural_stone', colorScheme: 'teal',
    check: qualifies(m => m.verifiedCount, 3),
    progress: progress(m => m.verifiedCount, 3),
  },
  {
    code: 'vein_tracker', title: 'Vein Tracker',
    description: 'Follow 3 mineral veins.',
    rarity: 'uncommon', icon: 'GitBranch', material: 'geo_topo', colorScheme: 'ruby',
    check: qualifies(m => m.bestMineralCount, 5),
    progress: progress(m => m.bestMineralCount, 5),
  },
  {
    code: 'perfect_strike', title: 'Perfect Strike',
    description: '10 correct identifications in a row.',
    rarity: 'epic', icon: 'Target', material: 'liquid_glass', colorScheme: 'violet',
    check: qualifies(m => m.maxConfidenceStreak, 10),
    progress: progress(m => m.maxConfidenceStreak, 10),
  },
  {
    code: 'memory_builder', title: 'Memory Builder',
    description: 'Create 5 memory capsules.',
    rarity: 'uncommon', icon: 'BookOpen', material: 'natural_stone', colorScheme: 'slate',
    check: qualifies(m => m.detailedNotesCount, 5),
    progress: progress(m => m.detailedNotesCount, 5),
  },
  {
    code: 'pocket_finder', title: 'Pocket Finder',
    description: 'Find 20 pocket gems.',
    rarity: 'common', icon: 'Package', material: 'metallic_inlay', colorScheme: 'gold',
    check: qualifies(m => m.count, 20),
    progress: progress(m => m.count, 20),
  },
  {
    code: 'earth_chosen', title: 'Earth Chosen',
    description: 'Find your first legendary specimen.',
    rarity: 'legendary', icon: 'Crown', material: 'crystal_core', colorScheme: 'gold',
    check: qualifies(m => m.rarityCounts.get('legendary') || 0),
    progress: progress(m => m.rarityCounts.get('legendary') || 0, 1),
  },
  {
    code: 'cartographer', title: 'Cartographer',
    description: 'Explore 100 sites.',
    rarity: 'epic', icon: 'Globe', material: 'geo_topo', colorScheme: 'ocean',
    check: qualifies(m => m.uniqueLocationsCount, 100),
    progress: progress(m => m.uniqueLocationsCount, 100),
  },
  {
    code: 'apex_hunter', title: 'Apex Hunter',
    description: 'Complete a 7-day streak.',
    rarity: 'epic', icon: 'Zap', material: 'metallic_inlay', colorScheme: 'gold',
    check: qualifies(m => m.maxDayStreak, 7),
    progress: progress(m => m.maxDayStreak, 7),
  },
  {
    code: 'legend_of_lode', title: 'Legend of the Lode',
    description: 'Discover a new mineral variant.',
    rarity: 'legendary', icon: 'Mountain', material: 'geo_topo', colorScheme: 'amethyst',
    check: qualifies(m => m.uniqueMineralsCount, 50),
    progress: progress(m => m.uniqueMineralsCount, 50),
  },

  // ── RARITY TIERS & SPECIAL REWARDS ──────────────────────────────────────────
  ...[
    ['rarity_common', 'Stone Signer', 'Collect your first common mineral.', 'common', 'Gem', 'natural_stone', 'slate'],
    ['rarity_uncommon', 'Uncommon Eye', 'Collect your first uncommon mineral.', 'uncommon', 'Sparkles', 'liquid_glass', 'teal'],
    ['rarity_rare', 'Rare Hunter', 'Collect your first rare mineral.', 'rare', 'Diamond', 'crystal_core', 'cyan'],
    ['rarity_legendary', 'Legendary Finder', 'Collect your first legendary mineral.', 'legendary', 'Crown', 'crystal_core', 'gold'],
  ].map(([code, title, description, rarity, icon, material, colorScheme]) => ({
    code, title, description, rarity, icon, material, colorScheme,
    check: qualifies(m => m.rarityCounts.get(rarity) || 0),
    progress: progress(m => m.rarityCounts.get(rarity) || 0, 1),
  })),
];

export const getBadgeDefinition = code => {
  const resolvedCode = ALIASES[code] || code;
  return BADGES.find(b => b.code === resolvedCode) || BADGES.find(b => b.code === code) || BADGES[0];
};

export const evaluateEarnedCodes = specimens => {
  const metrics = computeBadgeMetrics(specimens);
  return BADGES.filter(badge => badge.check(metrics)).map(badge => badge.code);
};
