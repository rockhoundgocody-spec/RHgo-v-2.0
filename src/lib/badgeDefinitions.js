// Badge catalog + earning rules. Pure functions — no side effects.
// To add a new badge: append to BADGES with `check` and `progress` predicates.

const uniqueMinerals = (specimens) =>
  new Set(specimens.map((s) => (s.mineral_name || '').toLowerCase().trim()).filter(Boolean)).size;

const uniqueLocations = (specimens) =>
  new Set(specimens.map((s) => (s.found_at || '').toLowerCase().trim()).filter(Boolean)).size;

const maxFindsAtOneHotspot = (specimens) => {
  const counts = {};
  for (const s of specimens) {
    const loc = (s.found_at || '').toLowerCase().trim();
    if (!loc) continue;
    counts[loc] = (counts[loc] || 0) + 1;
  }
  return Math.max(0, ...Object.values(counts));
};

// ─── BADGE CATALOG ────────────────────────────────────────────────────────────
export const BADGES = [
  // ── TIER 1: FIRST STEPS ───────────────────────────────────────────────────
  {
    code: 'first_find',
    title: 'First Find',
    description: 'Log your very first specimen.',
    rarity: 'common',
    icon: 'Gem',
    material: 'liquid_glass',
    colorScheme: 'amethyst',
    check: (s) => s.length >= 1,
    progress: (s) => ({ current: Math.min(s.length, 1), target: 1 }),
  },
  {
    code: 'sharp_eye',
    title: 'Sharp Eye',
    description: 'AI-identify a specimen with 90%+ confidence.',
    rarity: 'common',
    icon: 'Eye',
    material: 'natural_stone',
    colorScheme: 'teal',
    check: (s) => s.some((x) => (x.ai_confidence || 0) >= 0.9),
    progress: (s) => ({
      current: Math.min(s.filter((x) => (x.ai_confidence || 0) >= 0.9).length, 1),
      target: 1,
    }),
  },
  {
    code: 'pocket_finder',
    title: 'Pocket Finder',
    description: 'Log 3 specimens in a single day.',
    rarity: 'common',
    icon: 'Package',
    material: 'metallic_inlay',
    colorScheme: 'gold',
    check: (s) => {
      const byDay = {};
      for (const x of s) {
        const d = (x.found_date || x.created_date || '').slice(0, 10);
        if (d) byDay[d] = (byDay[d] || 0) + 1;
      }
      return Object.values(byDay).some((c) => c >= 3);
    },
    progress: (s) => {
      const byDay = {};
      for (const x of s) {
        const d = (x.found_date || x.created_date || '').slice(0, 10);
        if (d) byDay[d] = (byDay[d] || 0) + 1;
      }
      const best = Math.max(0, ...Object.values(byDay));
      return { current: Math.min(best, 3), target: 3 };
    },
  },

  // ── TIER 2: EXPLORER ──────────────────────────────────────────────────────
  {
    code: 'collector_5',
    title: 'Collector',
    description: 'Log 5 specimens.',
    rarity: 'uncommon',
    icon: 'Layers',
    material: 'crystal_core',
    colorScheme: 'emerald',
    check: (s) => s.length >= 5,
    progress: (s) => ({ current: Math.min(s.length, 5), target: 5 }),
  },
  {
    code: 'trailblazer',
    title: 'Trailblazer',
    description: 'Log finds from 3 different locations.',
    rarity: 'uncommon',
    icon: 'Footprints',
    material: 'geo_topo',
    colorScheme: 'copper',
    check: (s) => uniqueLocations(s) >= 3,
    progress: (s) => ({ current: Math.min(uniqueLocations(s), 3), target: 3 }),
  },
  {
    code: 'verified_eye',
    title: 'Verified Eye',
    description: 'Verify your first specimen.',
    rarity: 'uncommon',
    icon: 'CheckCircle2',
    material: 'liquid_glass',
    colorScheme: 'cyan',
    check: (s) => s.some((x) => x.verified === true),
    progress: (s) => ({
      current: Math.min(s.filter((x) => x.verified === true).length, 1),
      target: 1,
    }),
  },
  {
    code: 'memory_builder',
    title: 'Memory Builder',
    description: 'Add detailed notes to 5 specimens.',
    rarity: 'uncommon',
    icon: 'BookOpen',
    material: 'natural_stone',
    colorScheme: 'slate',
    check: (s) => s.filter((x) => (x.notes || '').length > 20).length >= 5,
    progress: (s) => ({
      current: Math.min(s.filter((x) => (x.notes || '').length > 20).length, 5),
      target: 5,
    }),
  },

  // ── TIER 3: SEEKER ────────────────────────────────────────────────────────
  {
    code: 'archivist_25',
    title: 'Archivist',
    description: 'Log 25 specimens.',
    rarity: 'rare',
    icon: 'Library',
    material: 'crystal_core',
    colorScheme: 'violet',
    check: (s) => s.length >= 25,
    progress: (s) => ({ current: Math.min(s.length, 25), target: 25 }),
  },
  {
    code: 'rare_seeker',
    title: 'Rare Seeker',
    description: 'Find a rare or legendary specimen.',
    rarity: 'rare',
    icon: 'Sparkles',
    material: 'metallic_inlay',
    colorScheme: 'amber',
    check: (s) => s.some((x) => x.rarity === 'rare' || x.rarity === 'legendary'),
    progress: (s) => ({
      current: Math.min(s.filter((x) => x.rarity === 'rare' || x.rarity === 'legendary').length, 1),
      target: 1,
    }),
  },
  {
    code: 'vein_tracker',
    title: 'Vein Tracker',
    description: 'Find 5 specimens of the same mineral type.',
    rarity: 'rare',
    icon: 'GitBranch',
    material: 'geo_topo',
    colorScheme: 'ruby',
    check: (s) => {
      const counts = {};
      for (const x of s) {
        const m = (x.mineral_name || '').toLowerCase().trim();
        if (m) counts[m] = (counts[m] || 0) + 1;
      }
      return Object.values(counts).some((c) => c >= 5);
    },
    progress: (s) => {
      const counts = {};
      for (const x of s) {
        const m = (x.mineral_name || '').toLowerCase().trim();
        if (m) counts[m] = (counts[m] || 0) + 1;
      }
      const best = Math.max(0, ...Object.values(counts));
      return { current: Math.min(best, 5), target: 5 };
    },
  },
  {
    code: 'pathfinder',
    title: 'Pathfinder',
    description: 'Visit 10 unique collecting locations.',
    rarity: 'rare',
    icon: 'Map',
    material: 'liquid_glass',
    colorScheme: 'jade',
    check: (s) => uniqueLocations(s) >= 10,
    progress: (s) => ({ current: Math.min(uniqueLocations(s), 10), target: 10 }),
  },

  // ── TIER 4: MASTER ────────────────────────────────────────────────────────
  {
    code: 'mineralogist',
    title: 'Crystal Whisperer',
    description: 'Identify 10 unique mineral types.',
    rarity: 'epic',
    icon: 'Hexagon',
    material: 'crystal_core',
    colorScheme: 'amethyst',
    check: (s) => uniqueMinerals(s) >= 10,
    progress: (s) => ({ current: Math.min(uniqueMinerals(s), 10), target: 10 }),
  },
  {
    code: 'globetrotter',
    title: 'Cartographer',
    description: 'Map finds from 5 distinct locations.',
    rarity: 'epic',
    icon: 'Globe',
    material: 'geo_topo',
    colorScheme: 'ocean',
    check: (s) => uniqueLocations(s) >= 5,
    progress: (s) => ({ current: Math.min(uniqueLocations(s), 5), target: 5 }),
  },
  {
    code: 'hotspot_regular',
    title: 'Hotspot Regular',
    description: 'Log 5 finds from the same location.',
    rarity: 'uncommon',
    icon: 'MapPin',
    material: 'natural_stone',
    colorScheme: 'copper',
    check: (s) => maxFindsAtOneHotspot(s) >= 5,
    progress: (s) => ({ current: Math.min(maxFindsAtOneHotspot(s), 5), target: 5 }),
  },
  {
    code: 'hotspot_master',
    title: 'Master of Stone',
    description: 'Log 10 finds from the same location.',
    rarity: 'epic',
    icon: 'Mountain',
    material: 'metallic_inlay',
    colorScheme: 'gold',
    check: (s) => maxFindsAtOneHotspot(s) >= 10,
    progress: (s) => ({ current: Math.min(maxFindsAtOneHotspot(s), 10), target: 10 }),
  },
  {
    code: 'perfect_strike',
    title: 'Perfect Strike',
    description: 'Log a geotagged find at a registered hotspot.',
    rarity: 'epic',
    icon: 'Target',
    material: 'liquid_glass',
    colorScheme: 'violet',
    check: (s) => s.some((x) => x.lat && x.lng && x.found_at),
    progress: (s) => ({
      current: Math.min(s.filter((x) => x.lat && x.lng && x.found_at).length, 1),
      target: 1,
    }),
  },

  // ── TIER 5: LEGEND ────────────────────────────────────────────────────────
  {
    code: 'legendary_strike',
    title: 'Legendary Strike',
    description: 'Unearth a legendary specimen.',
    rarity: 'legendary',
    icon: 'Crown',
    material: 'crystal_core',
    colorScheme: 'gold',
    check: (s) => s.some((x) => x.rarity === 'legendary'),
    progress: (s) => ({
      current: Math.min(s.filter((x) => x.rarity === 'legendary').length, 1),
      target: 1,
    }),
  },
  {
    code: 'earth_chosen',
    title: 'Earth Chosen',
    description: 'Reach 50 total specimens.',
    rarity: 'legendary',
    icon: 'Zap',
    material: 'geo_topo',
    colorScheme: 'amethyst',
    check: (s) => s.length >= 50,
    progress: (s) => ({ current: Math.min(s.length, 50), target: 50 }),
  },
  {
    code: 'shared_adventure',
    title: 'Shared Adventure',
    description: 'Share 3 specimen finds with the community.',
    rarity: 'rare',
    icon: 'Share2',
    material: 'natural_stone',
    colorScheme: 'teal',
    check: (s) => s.filter((x) => x.verified === true).length >= 3,
    progress: (s) => ({
      current: Math.min(s.filter((x) => x.verified === true).length, 3),
      target: 3,
    }),
  },
];

export function getBadgeDefinition(code) {
  return BADGES.find((b) => b.code === code);
}

export function evaluateEarnedCodes(specimens) {
  return BADGES.filter((b) => b.check(specimens || [])).map((b) => b.code);
}