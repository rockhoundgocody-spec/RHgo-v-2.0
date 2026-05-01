// Badge catalog + earning rules. Pure functions — no side effects.
// To add a new badge: append to BADGES with a `check(specimens)` predicate.

export const BADGES = [
  {
    code: 'first_find',
    title: 'First Find',
    description: 'Logged your very first specimen.',
    rarity: 'common',
    icon: 'Gem',
    check: (specimens) => specimens.length >= 1,
  },
  {
    code: 'collector_5',
    title: 'Collector',
    description: 'Logged 5 specimens.',
    rarity: 'uncommon',
    icon: 'Layers',
    check: (specimens) => specimens.length >= 5,
  },
  {
    code: 'archivist_25',
    title: 'Archivist',
    description: 'Logged 25 specimens.',
    rarity: 'rare',
    icon: 'Library',
    check: (specimens) => specimens.length >= 25,
  },
  {
    code: 'rare_hunter',
    title: 'Rare Hunter',
    description: 'Found a specimen tagged rare.',
    rarity: 'rare',
    icon: 'Sparkles',
    check: (specimens) => specimens.some((s) => s.rarity === 'rare'),
  },
  {
    code: 'legendary_strike',
    title: 'Legendary Strike',
    description: 'Unearthed a legendary specimen.',
    rarity: 'legendary',
    icon: 'Crown',
    check: (specimens) => specimens.some((s) => s.rarity === 'legendary'),
  },
  {
    code: 'mineralogist',
    title: 'Mineralogist',
    description: 'Logged 10 unique mineral types.',
    rarity: 'epic',
    icon: 'Hexagon',
    check: (specimens) =>
      new Set(specimens.map((s) => (s.mineral_name || '').toLowerCase().trim()).filter(Boolean)).size >= 10,
  },
  {
    code: 'globetrotter',
    title: 'Globetrotter',
    description: 'Logged finds from 5 distinct locations.',
    rarity: 'epic',
    icon: 'MapPin',
    check: (specimens) =>
      new Set(specimens.map((s) => (s.found_at || '').toLowerCase().trim()).filter(Boolean)).size >= 5,
  },
  {
    code: 'verified_eye',
    title: 'Verified Eye',
    description: 'Verified your first specimen.',
    rarity: 'uncommon',
    icon: 'CheckCircle2',
    check: (specimens) => specimens.some((s) => s.verified === true),
  },
];

export function getBadgeDefinition(code) {
  return BADGES.find((b) => b.code === code);
}

// Returns the codes the user qualifies for given their specimens.
export function evaluateEarnedCodes(specimens) {
  return BADGES.filter((b) => b.check(specimens || [])).map((b) => b.code);
}