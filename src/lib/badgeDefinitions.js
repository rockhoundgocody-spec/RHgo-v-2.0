// Badge catalog + earning rules. Pure functions — no side effects.

export const computeMetrics = (s = []) => {
  const m = {
    count: s.length,
    mineralCounts: {},
    locationCounts: {},
    rarityCounts: {},
    verifiedCount: 0,
    highConfidenceCount: 0,
    detailedNotesCount: 0,
    hasLegendary: false,
    maxStreak: 0,
    maxConfidenceStreak: 0,
    uniqueMineralsCount: 0,
    uniqueLocationsCount: 0,
    maxFindsAtSingleSpot: 0,
    bestMineralCount: 0,
    rareOrLegendaryCount: 0,
  };

  const datesSet = new Set();

  for (let i = 0; i < s.length; i++) {
    const x = s[i];

    // Mineral counts
    const min = (x.mineral_name || '').toLowerCase().trim();
    if (min) {
      m.mineralCounts[min] = (m.mineralCounts[min] || 0) + 1;
    }

    // Location counts
    const l = (x.found_at || '').toLowerCase().trim();
    if (l) {
      m.locationCounts[l] = (m.locationCounts[l] || 0) + 1;
    }

    // Rarity counts
    const r = x.rarity || 'common';
    m.rarityCounts[r] = (m.rarityCounts[r] || 0) + 1;
    if (r === 'legendary') m.hasLegendary = true;
    if (r === 'rare' || r === 'legendary') m.rareOrLegendaryCount++;

    // Other simple counts
    if (x.verified === true) m.verifiedCount++;
    if ((x.ai_confidence || 0) >= 0.8) m.highConfidenceCount++;
    if ((x.notes || '').length > 20) m.detailedNotesCount++;

    // For streak calculation
    const d = (x.found_date || x.created_date || '').slice(0, 10);
    if (d) datesSet.add(d);
  }

  const mineralValues = Object.values(m.mineralCounts);
  m.uniqueMineralsCount = mineralValues.length;
  m.bestMineralCount = mineralValues.length ? Math.max(...mineralValues) : 0;

  const locationValues = Object.values(m.locationCounts);
  m.uniqueLocationsCount = locationValues.length;
  m.maxFindsAtSingleSpot = locationValues.length ? Math.max(...locationValues) : 0;

  // Streak Calculation
  const sortedDates = Array.from(datesSet).sort();
  if (sortedDates.length > 0) {
    let best = 1, cur = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const diff = (Number(new Date(sortedDates[i])) - Number(new Date(sortedDates[i - 1]))) / 86400000;
      cur = Math.round(diff) === 1 ? cur + 1 : 1;
      best = Math.max(best, cur);
    }
    m.maxStreak = best;
  }

  // Perfect Strike (90%+ confidence streak)
  const sortedSpecimens = [...s].sort((a, b) => Number(new Date(a.created_date || 0)) - Number(new Date(b.created_date || 0)));
  let cStreak = 0, maxCStreak = 0;
  for (let i = 0; i < sortedSpecimens.length; i++) {
    if ((sortedSpecimens[i].ai_confidence || 0) >= 0.9) {
      cStreak++;
      if (cStreak > maxCStreak) maxCStreak = cStreak;
    } else {
      cStreak = 0;
    }
  }
  m.maxConfidenceStreak = maxCStreak;

  return m;
};

export const BADGES = [
  // ── TIER 1: FIRST STEPS ──────────────────────────────────────────────────
  {
    code: 'first_find', title: 'Crystal Whisperer',
    description: 'Find your first rare crystal.',
    rarity: 'common', icon: 'Gem', material: 'liquid_glass', colorScheme: 'amethyst',
    check: m => m.count >= 1,
    progress: m => ({ current: Math.min(m.count, 1), target: 1 }),
  },
  {
    code: 'sharp_eye', title: 'Sharp Eye',
    description: 'AI-identify 10 specimens correctly with 80%+ confidence.',
    rarity: 'common', icon: 'Eye', material: 'natural_stone', colorScheme: 'teal',
    check: m => m.highConfidenceCount >= 10,
    progress: m => ({ current: Math.min(m.highConfidenceCount, 10), target: 10 }),
  },
  {
    code: 'pocket_finder', title: 'Pocket Finder',
    description: 'Find 20 pocket gems (small specimens).',
    rarity: 'common', icon: 'Package', material: 'metallic_inlay', colorScheme: 'gold',
    check: m => m.count >= 20,
    progress: m => ({ current: Math.min(m.count, 20), target: 20 }),
  },

  // ── TIER 2: EXPLORER ─────────────────────────────────────────────────────
  {
    code: 'trailblazer', title: 'Trailblazer',
    description: 'Explore 25 different sites.',
    rarity: 'uncommon', icon: 'Footprints', material: 'geo_topo', colorScheme: 'copper',
    check: m => m.uniqueLocationsCount >= 25,
    progress: m => ({ current: Math.min(m.uniqueLocationsCount, 25), target: 25 }),
  },
  {
    code: 'verified_eye', title: 'Verified Eye',
    description: 'Verify your first specimen.',
    rarity: 'uncommon', icon: 'CheckCircle2', material: 'liquid_glass', colorScheme: 'cyan',
    check: m => m.verifiedCount >= 1,
    progress: m => ({ current: Math.min(m.verifiedCount, 1), target: 1 }),
  },
  {
    code: 'memory_builder', title: 'Memory Builder',
    description: 'Create 5 memory capsules (specimens with detailed notes).',
    rarity: 'uncommon', icon: 'BookOpen', material: 'natural_stone', colorScheme: 'slate',
    check: m => m.detailedNotesCount >= 5,
    progress: m => ({ current: Math.min(m.detailedNotesCount, 5), target: 5 }),
  },
  {
    code: 'vein_tracker', title: 'Vein Tracker',
    description: 'Follow 3 mineral veins — find 5 of the same mineral type.',
    rarity: 'uncommon', icon: 'GitBranch', material: 'geo_topo', colorScheme: 'ruby',
    check: m => m.bestMineralCount >= 5,
    progress: m => ({ current: Math.min(m.bestMineralCount, 5), target: 5 }),
  },

  // ── TIER 3: SEEKER ───────────────────────────────────────────────────────
  {
    code: 'archivist_25', title: 'Master of Stone',
    description: 'Collect 250 specimens.',
    rarity: 'rare', icon: 'Library', material: 'crystal_core', colorScheme: 'violet',
    check: m => m.count >= 250,
    progress: m => ({ current: Math.min(m.count, 250), target: 250 }),
  },
  {
    code: 'rare_seeker', title: 'Rare Seeker',
    description: 'Find 5 rare or legendary specimens.',
    rarity: 'rare', icon: 'Sparkles', material: 'metallic_inlay', colorScheme: 'amber',
    check: m => m.rareOrLegendaryCount >= 5,
    progress: m => ({ current: Math.min(m.rareOrLegendaryCount, 5), target: 5 }),
  },
  {
    code: 'pathfinder', title: 'Pathfinder',
    description: 'Explore 50 unique collecting sites.',
    rarity: 'rare', icon: 'Map', material: 'liquid_glass', colorScheme: 'jade',
    check: m => m.uniqueLocationsCount >= 50,
    progress: m => ({ current: Math.min(m.uniqueLocationsCount, 50), target: 50 }),
  },
  {
    code: 'shared_adventure', title: 'Shared Adventure',
    description: 'Complete your first family trip — share 3 verified finds.',
    rarity: 'rare', icon: 'Share2', material: 'natural_stone', colorScheme: 'teal',
    check: m => m.verifiedCount >= 3,
    progress: m => ({ current: Math.min(m.verifiedCount, 3), target: 3 }),
  },

  // ── TIER 4: MASTER ───────────────────────────────────────────────────────
  {
    code: 'mineralogist', title: 'Crystal Whisperer II',
    description: 'Identify 10 unique mineral types.',
    rarity: 'epic', icon: 'Hexagon', material: 'crystal_core', colorScheme: 'amethyst',
    check: m => m.uniqueMineralsCount >= 10,
    progress: m => ({ current: Math.min(m.uniqueMineralsCount, 10), target: 10 }),
  },
  {
    code: 'globetrotter', title: 'Cartographer',
    description: 'Explore 100 unique sites.',
    rarity: 'epic', icon: 'Globe', material: 'geo_topo', colorScheme: 'ocean',
    check: m => m.uniqueLocationsCount >= 100,
    progress: m => ({ current: Math.min(m.uniqueLocationsCount, 100), target: 100 }),
  },
  {
    code: 'perfect_strike', title: 'Perfect Strike',
    description: '10 correct AI identifications in a row (90%+ confidence streak).',
    rarity: 'epic', icon: 'Target', material: 'liquid_glass', colorScheme: 'violet',
    check: m => m.maxConfidenceStreak >= 10,
    progress: m => ({ current: Math.min(m.maxConfidenceStreak, 10), target: 10 }),
  },
  {
    code: 'apex_hunter', title: 'Apex Hunter',
    description: 'Complete a 7-day logging streak.',
    rarity: 'epic', icon: 'Zap', material: 'metallic_inlay', colorScheme: 'gold',
    check: m => m.maxStreak >= 7,
    progress: m => ({ current: Math.min(m.maxStreak, 7), target: 7 }),
  },

  // ── TIER 5: LEGEND ───────────────────────────────────────────────────────
  {
    code: 'earth_chosen', title: 'Earth Chosen',
    description: 'Find your first legendary specimen.',
    rarity: 'legendary', icon: 'Crown', material: 'crystal_core', colorScheme: 'gold',
    check: m => m.hasLegendary,
    progress: m => ({ current: m.hasLegendary ? 1 : 0, target: 1 }),
  },
  {
    code: 'legend_of_lode', title: 'Legend of the Lode',
    description: 'Discover a new mineral variant — reach 50 unique mineral types.',
    rarity: 'legendary', icon: 'Mountain', material: 'geo_topo', colorScheme: 'amethyst',
    check: m => m.uniqueMineralsCount >= 50,
    progress: m => ({ current: Math.min(m.uniqueMineralsCount, 50), target: 50 }),
  },
  {
    code: 'hotspot_master', title: 'Master of Stone II',
    description: 'Log 10 finds from the same location.',
    rarity: 'legendary', icon: 'Star', material: 'metallic_inlay', colorScheme: 'amber',
    check: m => m.maxFindsAtSingleSpot >= 10,
    progress: m => ({ current: Math.min(m.maxFindsAtSingleSpot, 10), target: 10 }),
  },
];

export const getBadgeDefinition = code => BADGES.find(b => b.code === code);
export const evaluateEarnedCodes = specimens => {
  const m = computeMetrics(specimens || []);
  return BADGES.filter(b => b.check(m)).map(b => b.code);
};
