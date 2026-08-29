// Geo-Badge catalog + earning rules. Pure functions — no side effects.

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

// Approximate a "biome" (region) from a found_at location string — the last
// comma-separated segment is usually a state/region, a reasonable biome proxy.
function biomeOf(foundAt) {
  if (typeof foundAt !== 'string') return null;
  const trimmed = foundAt.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
  const region = parts[parts.length - 1] || trimmed;
  return region.toLowerCase();
}

export function computeBadgeMetrics(specimens = [], context = {}) {
  const list = Array.isArray(specimens) ? specimens : [];
  const mineralCounts = new Map();
  const locationCounts = new Map();
  const biomeCounts = new Map();
  const rarityCounts = new Map();
  const dayKeys = new Set();
  const confidenceSequence = [];
  let verifiedCount = 0;
  let highConfidenceCount = 0;
  let ultraHighConfidenceCount = 0;
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

    const biome = biomeOf(specimen?.found_at);
    if (biome) biomeCounts.set(biome, (biomeCounts.get(biome) || 0) + 1);

    const rarity = specimen?.rarity || 'common';
    rarityCounts.set(rarity, (rarityCounts.get(rarity) || 0) + 1);
    if (rarity === 'rare' || rarity === 'legendary') rareOrLegendaryCount += 1;

    if (specimen?.verified === true) verifiedCount += 1;
    const confidence = Number(specimen?.ai_confidence) || 0;
    if (confidence >= 0.8) highConfidenceCount += 1;
    if (confidence >= 0.95) ultraHighConfidenceCount += 1;
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

  // ── Context-derived metrics (community posts, quests, player profile) ──────
  const posts = Array.isArray(context.posts) ? context.posts : [];
  const quests = Array.isArray(context.quests) ? context.quests : [];
  const profile = context.playerProfile || null;
  const myEmail = profile?.owner_email || context.ownerEmail || null;

  const myPosts = myEmail ? posts.filter((p) => p.owner_email === myEmail) : [];
  const communityPostCount = myPosts.length;
  const totalReactions = myPosts.reduce((sum, p) => {
    const r = p.reactions || {};
    return sum + (r.fire || 0) + (r.gem || 0) + (r.clap || 0) + (r.wow || 0);
  }, 0);

  let commentHelpCount = 0;
  if (myEmail) {
    for (const p of posts) {
      if (p.owner_email === myEmail) continue; // only comments on OTHERS' posts count
      const comments = Array.isArray(p.comments) ? p.comments : [];
      for (const c of comments) {
        if (c?.email === myEmail) commentHelpCount += 1;
      }
    }
  }

  const completedQuestCount = myEmail
    ? quests.filter((q) => q.owner_email === myEmail && q.status === 'completed').length
    : 0;
  const playerLevel = profile?.level || 0;

  return {
    [BADGE_METRICS]: true,
    count: list.length,
    uniqueMineralsCount: mineralCounts.size,
    uniqueLocationsCount: locationCounts.size,
    uniqueBiomeCount: biomeCounts.size,
    bestMineralCount,
    verifiedCount,
    highConfidenceCount,
    ultraHighConfidenceCount,
    detailedNotesCount,
    rareOrLegendaryCount,
    maxDayStreak,
    maxConfidenceStreak,
    rarityCounts,
    communityPostCount,
    totalReactions,
    commentHelpCount,
    completedQuestCount,
    playerLevel,
  };
}

function resolveMetrics(input) {
  return input?.[BADGE_METRICS] ? input : computeBadgeMetrics(input);
}

const qualifies = (select, target = 1) => (input) => select(resolveMetrics(input)) >= target;
const progress = (select, target) => (input) => ({
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
  // ── THE 15 ORIGINAL GEO-BADGES ───────────────────────────────────────────────
  {
    code: 'crystal_whisperer', title: 'Crystal Whisperer',
    description: 'Find your first rare crystal.',
    rarity: 'common', icon: 'Gem', material: 'liquid_glass', colorScheme: 'amethyst', category: 'discovery',
    check: qualifies(m => m.count),
    progress: progress(m => m.count, 1),
  },
  {
    code: 'trailblazer', title: 'Trailblazer',
    description: 'Explore 25 sites.',
    rarity: 'uncommon', icon: 'Footprints', material: 'geo_topo', colorScheme: 'copper', category: 'discovery',
    check: qualifies(m => m.uniqueLocationsCount, 25),
    progress: progress(m => m.uniqueLocationsCount, 25),
  },
  {
    code: 'pathfinder', title: 'Pathfinder',
    description: 'Explore 50 sites.',
    rarity: 'rare', icon: 'Map', material: 'liquid_glass', colorScheme: 'jade', category: 'discovery',
    check: qualifies(m => m.uniqueLocationsCount, 50),
    progress: progress(m => m.uniqueLocationsCount, 50),
  },
  {
    code: 'master_of_stone', title: 'Master of Stone',
    description: 'Collect 250 specimens.',
    rarity: 'rare', icon: 'Library', material: 'crystal_core', colorScheme: 'violet', category: 'discovery',
    check: qualifies(m => m.count, 250),
    progress: progress(m => m.count, 250),
  },
  {
    code: 'sharp_eye', title: 'Sharp Eye',
    description: 'Identify 10 rocks correctly.',
    rarity: 'common', icon: 'Eye', material: 'natural_stone', colorScheme: 'teal', category: 'mastery',
    check: qualifies(m => m.highConfidenceCount, 10),
    progress: progress(m => m.highConfidenceCount, 10),
  },
  {
    code: 'rare_seeker', title: 'Rare Seeker',
    description: 'Find 5 rare specimens.',
    rarity: 'rare', icon: 'Sparkles', material: 'metallic_inlay', colorScheme: 'amber', category: 'discovery',
    check: qualifies(m => m.rareOrLegendaryCount, 5),
    progress: progress(m => m.rareOrLegendaryCount, 5),
  },
  {
    code: 'shared_adventure', title: 'Shared Adventure',
    description: 'Complete your first family trip.',
    rarity: 'rare', icon: 'Share2', material: 'natural_stone', colorScheme: 'teal', category: 'community',
    check: qualifies(m => m.verifiedCount, 3),
    progress: progress(m => m.verifiedCount, 3),
  },
  {
    code: 'vein_tracker', title: 'Vein Tracker',
    description: 'Follow 3 mineral veins.',
    rarity: 'uncommon', icon: 'GitBranch', material: 'geo_topo', colorScheme: 'ruby', category: 'discovery',
    check: qualifies(m => m.bestMineralCount, 5),
    progress: progress(m => m.bestMineralCount, 5),
  },
  {
    code: 'perfect_strike', title: 'Perfect Strike',
    description: '10 correct identifications in a row.',
    rarity: 'epic', icon: 'Target', material: 'liquid_glass', colorScheme: 'violet', category: 'mastery',
    check: qualifies(m => m.maxConfidenceStreak, 10),
    progress: progress(m => m.maxConfidenceStreak, 10),
  },
  {
    code: 'memory_builder', title: 'Memory Builder',
    description: 'Create 5 memory capsules.',
    rarity: 'uncommon', icon: 'BookOpen', material: 'natural_stone', colorScheme: 'slate', category: 'discovery',
    check: qualifies(m => m.detailedNotesCount, 5),
    progress: progress(m => m.detailedNotesCount, 5),
  },
  {
    code: 'pocket_finder', title: 'Pocket Finder',
    description: 'Find 20 pocket gems.',
    rarity: 'common', icon: 'Package', material: 'metallic_inlay', colorScheme: 'gold', category: 'discovery',
    check: qualifies(m => m.count, 20),
    progress: progress(m => m.count, 20),
  },
  {
    code: 'earth_chosen', title: 'Earth Chosen',
    description: 'Find your first legendary specimen.',
    rarity: 'legendary', icon: 'Crown', material: 'crystal_core', colorScheme: 'gold', category: 'discovery',
    check: qualifies(m => m.rarityCounts.get('legendary') || 0),
    progress: progress(m => m.rarityCounts.get('legendary') || 0, 1),
  },
  {
    code: 'cartographer', title: 'Cartographer',
    description: 'Explore 100 sites.',
    rarity: 'epic', icon: 'Globe', material: 'geo_topo', colorScheme: 'ocean', category: 'discovery',
    check: qualifies(m => m.uniqueLocationsCount, 100),
    progress: progress(m => m.uniqueLocationsCount, 100),
  },
  {
    code: 'apex_hunter', title: 'Apex Hunter',
    description: 'Complete a 7-day streak.',
    rarity: 'epic', icon: 'Zap', material: 'metallic_inlay', colorScheme: 'gold', category: 'discovery',
    check: qualifies(m => m.maxDayStreak, 7),
    progress: progress(m => m.maxDayStreak, 7),
  },
  {
    code: 'legend_of_lode', title: 'Legend of the Lode',
    description: 'Discover a new mineral variant.',
    rarity: 'legendary', icon: 'Mountain', material: 'geo_topo', colorScheme: 'amethyst', category: 'discovery',
    check: qualifies(m => m.uniqueMineralsCount, 50),
    progress: progress(m => m.uniqueMineralsCount, 50),
  },

  // ── DISCOVERY GEO-BADGES (new) ──────────────────────────────────────────────
  {
    code: 'streak_surveyor', title: 'Streak Surveyor',
    description: 'Identify specimens 7 days in a row.',
    rarity: 'uncommon', icon: 'CalendarCheck', material: 'geo_topo', colorScheme: 'teal', category: 'discovery',
    check: qualifies(m => m.maxDayStreak, 7),
    progress: progress(m => m.maxDayStreak, 7),
  },
  {
    code: 'century_collector', title: 'Century Collector',
    description: 'Log 100 specimens in your collection.',
    rarity: 'uncommon', icon: 'Package', material: 'metallic_inlay', colorScheme: 'copper', category: 'discovery',
    check: qualifies(m => m.count, 100),
    progress: progress(m => m.count, 100),
  },
  {
    code: 'mineral_cartographer', title: 'Mineral Cartographer',
    description: 'Map 25 unique collecting locations.',
    rarity: 'rare', icon: 'MapPin', material: 'geo_topo', colorScheme: 'jade', category: 'discovery',
    check: qualifies(m => m.uniqueLocationsCount, 25),
    progress: progress(m => m.uniqueLocationsCount, 25),
  },
  {
    code: 'biome_hunter', title: 'Biome Hunter',
    description: 'Find specimens across 5 different geological biomes.',
    rarity: 'rare', icon: 'Leaf', material: 'natural_stone', colorScheme: 'emerald', category: 'discovery',
    check: qualifies(m => m.uniqueBiomeCount, 5),
    progress: progress(m => m.uniqueBiomeCount, 5),
  },

  // ── COMMUNITY GEO-BADGES (new) ──────────────────────────────────────────────
  {
    code: 'trail_guide', title: 'Trail Guide',
    description: 'Create 10 expedition plans shared with the community.',
    rarity: 'rare', icon: 'Route', material: 'liquid_glass', colorScheme: 'ocean', category: 'community',
    check: qualifies(m => m.communityPostCount, 10),
    progress: progress(m => m.communityPostCount, 10),
  },
  {
    code: 'mentor', title: 'Mentor',
    description: 'Help 5 new users via comments on discovery posts.',
    rarity: 'epic', icon: 'Sprout', material: 'crystal_core', colorScheme: 'amethyst', category: 'community',
    check: qualifies(m => m.commentHelpCount, 5),
    progress: progress(m => m.commentHelpCount, 5),
  },
  {
    code: 'crowd_favorite', title: 'Crowd Favorite',
    description: 'Receive 100 total likes on your discovery posts.',
    rarity: 'legendary', icon: 'Trophy', material: 'crystal_core', colorScheme: 'gold', category: 'community',
    check: qualifies(m => m.totalReactions, 100),
    progress: progress(m => m.totalReactions, 100),
  },

  // ── MASTERY GEO-BADGES (new) ────────────────────────────────────────────────
  {
    code: 'crystallographer', title: 'Crystallographer',
    description: 'Identify 50 specimens with 95%+ AI confidence.',
    rarity: 'epic', icon: 'FlaskConical', material: 'crystal_core', colorScheme: 'cyan', category: 'mastery',
    check: qualifies(m => m.ultraHighConfidenceCount, 50),
    progress: progress(m => m.ultraHighConfidenceCount, 50),
  },
  {
    code: 'field_expeditionist', title: 'Field Expeditionist',
    description: 'Complete 10 field missions.',
    rarity: 'epic', icon: 'Footprints', material: 'geo_topo', colorScheme: 'copper', category: 'mastery',
    check: qualifies(m => m.completedQuestCount, 10),
    progress: progress(m => m.completedQuestCount, 10),
  },
  {
    code: 'rare_find_specialist', title: 'Rare Find Specialist',
    description: 'Document 5 specimens rated Rare or higher.',
    rarity: 'rare', icon: 'Diamond', material: 'crystal_core', colorScheme: 'ruby', category: 'mastery',
    check: qualifies(m => m.rareOrLegendaryCount, 5),
    progress: progress(m => m.rareOrLegendaryCount, 5),
  },
  {
    code: 'geo_legend', title: 'Geo-Legend',
    description: 'Reach Level 100.',
    rarity: 'mythic', icon: 'Crown', material: 'crystal_core', colorScheme: 'mythic', category: 'mastery',
    check: qualifies(m => m.playerLevel, 100),
    progress: progress(m => m.playerLevel, 100),
  },

  // ── RARITY TIERS & SPECIAL REWARDS ──────────────────────────────────────────
  ...[
    ['rarity_common', 'Stone Signer', 'Collect your first common mineral.', 'common', 'Gem', 'natural_stone', 'slate'],
    ['rarity_uncommon', 'Uncommon Eye', 'Collect your first uncommon mineral.', 'uncommon', 'Sparkles', 'liquid_glass', 'teal'],
    ['rarity_rare', 'Rare Hunter', 'Collect your first rare mineral.', 'rare', 'Diamond', 'crystal_core', 'cyan'],
    ['rarity_legendary', 'Legendary Finder', 'Collect your first legendary mineral.', 'legendary', 'Crown', 'crystal_core', 'gold'],
  ].map(([code, title, description, rarity, icon, material, colorScheme]) => ({
    code, title, description, rarity, icon, material, colorScheme, category: 'discovery',
    check: qualifies(m => m.rarityCounts.get(rarity) || 0),
    progress: progress(m => m.rarityCounts.get(rarity) || 0, 1),
  })),
];

export const getBadgeDefinition = code => {
  const resolvedCode = ALIASES[code] || code;
  return BADGES.find(b => b.code === resolvedCode) || BADGES.find(b => b.code === code) || BADGES[0];
};

// Performance Optimization: Accept specimens array or precomputed metrics object to avoid redundant O(N) computeBadgeMetrics calculation when caller already has metrics.
export const evaluateEarnedCodes = (specimensOrMetrics, context = {}) => {
  const metrics = specimensOrMetrics?.[BADGE_METRICS]
    ? specimensOrMetrics
    : computeBadgeMetrics(specimensOrMetrics, context);
  return BADGES.filter(badge => badge.check(metrics)).map(badge => badge.code);
};