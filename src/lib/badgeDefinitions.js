// Badge catalog + earning rules. Pure functions — no side effects.
// To add a new badge: append to BADGES with a `check(specimens)` predicate.

// Each badge has:
//   - check(specimens) → boolean (earned?)
//   - progress(specimens) → { current, target } (for the progress dashboard)
const uniqueMinerals = (specimens) =>
  new Set(specimens.map((s) => (s.mineral_name || '').toLowerCase().trim()).filter(Boolean)).size;
const uniqueLocations = (specimens) =>
  new Set(specimens.map((s) => (s.found_at || '').toLowerCase().trim()).filter(Boolean)).size;

// Returns the max count of specimens found at any single location
const maxFindsAtOneHotspot = (specimens) => {
  const counts = {};
  for (const s of specimens) {
    const loc = (s.found_at || '').toLowerCase().trim();
    if (!loc) continue;
    counts[loc] = (counts[loc] || 0) + 1;
  }
  return Math.max(0, ...Object.values(counts));
};

export const BADGES = [
  {
    code: 'first_find',
    title: 'First Find',
    description: 'Log your very first specimen.',
    rarity: 'common',
    icon: 'Gem',
    check: (s) => s.length >= 1,
    progress: (s) => ({ current: Math.min(s.length, 1), target: 1 }),
  },
  {
    code: 'collector_5',
    title: 'Collector',
    description: 'Log 5 specimens.',
    rarity: 'uncommon',
    icon: 'Layers',
    check: (s) => s.length >= 5,
    progress: (s) => ({ current: Math.min(s.length, 5), target: 5 }),
  },
  {
    code: 'archivist_25',
    title: 'Archivist',
    description: 'Log 25 specimens.',
    rarity: 'rare',
    icon: 'Library',
    check: (s) => s.length >= 25,
    progress: (s) => ({ current: Math.min(s.length, 25), target: 25 }),
  },
  {
    code: 'rare_hunter',
    title: 'Rare Hunter',
    description: 'Find a specimen tagged rare.',
    rarity: 'rare',
    icon: 'Sparkles',
    check: (s) => s.some((x) => x.rarity === 'rare'),
    progress: (s) => ({
      current: Math.min(s.filter((x) => x.rarity === 'rare').length, 1),
      target: 1,
    }),
  },
  {
    code: 'legendary_strike',
    title: 'Legendary Strike',
    description: 'Unearth a legendary specimen.',
    rarity: 'legendary',
    icon: 'Crown',
    check: (s) => s.some((x) => x.rarity === 'legendary'),
    progress: (s) => ({
      current: Math.min(s.filter((x) => x.rarity === 'legendary').length, 1),
      target: 1,
    }),
  },
  {
    code: 'mineralogist',
    title: 'Mineralogist',
    description: 'Log 10 unique mineral types.',
    rarity: 'epic',
    icon: 'Hexagon',
    check: (s) => uniqueMinerals(s) >= 10,
    progress: (s) => ({ current: Math.min(uniqueMinerals(s), 10), target: 10 }),
  },
  {
    code: 'globetrotter',
    title: 'Globetrotter',
    description: 'Log finds from 5 distinct locations.',
    rarity: 'epic',
    icon: 'MapPin',
    check: (s) => uniqueLocations(s) >= 5,
    progress: (s) => ({ current: Math.min(uniqueLocations(s), 5), target: 5 }),
  },
  {
    code: 'hotspot_regular',
    title: 'Hotspot Regular',
    description: 'Log 5 finds from the same location.',
    rarity: 'uncommon',
    icon: 'MapPin',
    check: (s) => maxFindsAtOneHotspot(s) >= 5,
    progress: (s) => ({ current: Math.min(maxFindsAtOneHotspot(s), 5), target: 5 }),
  },
  {
    code: 'hotspot_master',
    title: 'Hotspot Master',
    description: 'Log 10 finds from the same location.',
    rarity: 'epic',
    icon: 'Mountain',
    check: (s) => maxFindsAtOneHotspot(s) >= 10,
    progress: (s) => ({ current: Math.min(maxFindsAtOneHotspot(s), 10), target: 10 }),
  },
  {
    code: 'verified_eye',
    title: 'Verified Eye',
    description: 'Verify your first specimen.',
    rarity: 'uncommon',
    icon: 'CheckCircle2',
    check: (s) => s.some((x) => x.verified === true),
    progress: (s) => ({
      current: Math.min(s.filter((x) => x.verified === true).length, 1),
      target: 1,
    }),
  },
];

export function getBadgeDefinition(code) {
  return BADGES.find((b) => b.code === code);
}

// Returns the codes the user qualifies for given their specimens.
export function evaluateEarnedCodes(specimens) {
  return BADGES.filter((b) => b.check(specimens || [])).map((b) => b.code);
}