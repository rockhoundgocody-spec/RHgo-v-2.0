/**
 * Spawn Engine — Pokémon GO-style mineral spawn generation
 * Fully client-side, deterministic per location + time bucket.
 */

const RARITY_WEIGHTS = [
  { rarity: 'common',    weight: 65 },
  { rarity: 'uncommon',  weight: 22 },
  { rarity: 'rare',      weight: 9  },
  { rarity: 'legendary', weight: 4  },
];

const MINERAL_POOLS = {
  common:    ['Quartz', 'Calcite', 'Feldspar', 'Limestone', 'Granite', 'Sandstone', 'Shale', 'Basalt'],
  uncommon:  ['Agate', 'Mica', 'Pyrite', 'Obsidian', 'Jasper', 'Chert', 'Chalcedony', 'Fluorite'],
  rare:      ['Amethyst', 'Garnet', 'Turquoise', 'Labradorite', 'Rose Quartz', 'Citrine', 'Sodalite'],
  legendary: ['Native Gold', 'Meteorite', 'Alexandrite', 'Benitoite', 'Painite', 'Moldavite'],
};

const RARITY_XP   = { common: 50, uncommon: 150, rare: 400, legendary: 1200 };
const RARITY_COLORS = {
  common:    { color: 'hsl(215,35%,68%)',   glow: 'hsla(215,40%,65%,0.6)',  emoji: '🪨' },
  uncommon:  { color: 'hsl(152,70%,52%)',   glow: 'hsla(152,80%,50%,0.65)', emoji: '✨' },
  rare:      { color: 'hsl(195,100%,68%)',  glow: 'hsla(195,100%,60%,0.7)', emoji: '💎' },
  legendary: { color: 'hsl(45,100%,62%)',   glow: 'hsla(45,100%,60%,0.8)',  emoji: '👑' },
};

// Seeded pseudo-random so same location + bucket = same spawn set
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function weightedPick(rand, pool) {
  const total = pool.reduce((a, b) => a + b.weight, 0);
  let r = rand() * total;
  for (const item of pool) { r -= item.weight; if (r <= 0) return item; }
  return pool[pool.length - 1];
}

function offsetCoord(value, rand, maxMeters = 300) {
  const deg = (maxMeters / 111320);
  return value + (rand() - 0.5) * 2 * deg;
}

/**
 * generateSpawns(lat, lng, options) → spawn[]
 * Refreshes every 30 min (time bucket). Up to 8 per refresh.
 */
export function generateSpawns(lat, lng, { count = 6, collectedMinerals = new Set(), nearHotspot = false } = {}) {
  if (!lat || !lng) return [];

  // 30-min time bucket
  const bucket = Math.floor(Date.now() / (30 * 60 * 1000));
  const seed = Math.abs(Math.round(lat * 1000) * 100003 + Math.round(lng * 1000) * 999983 + bucket * 7919);
  const rand = seededRandom(seed);

  const spawnCount = nearHotspot ? count + 2 : count;

  return Array.from({ length: spawnCount }, (_, i) => {
    const r = seededRandom(seed + i * 31337);
    const { rarity } = weightedPick(r, RARITY_WEIGHTS);
    const pool = MINERAL_POOLS[rarity];
    const mineral = pool[Math.floor(r() * pool.length)];
    const isShiny = r() < 0.025; // 2.5% shiny chance
    const alreadyCollected = collectedMinerals.has(mineral.toLowerCase());

    return {
      id: `spawn_${bucket}_${i}`,
      mineral_name: mineral,
      rarity,
      is_shiny: isShiny,
      xp: RARITY_XP[rarity] * (isShiny ? 2 : 1),
      lat: offsetCoord(lat, r, nearHotspot ? 150 : 300),
      lng: offsetCoord(lng, r, nearHotspot ? 150 : 300),
      expires_at: (Math.floor(Date.now() / (30 * 60 * 1000)) + 1) * 30 * 60 * 1000 + r() * 10 * 60 * 1000,
      already_collected: alreadyCollected,
      catch_chance: rarity === 'legendary' ? 0.35 : rarity === 'rare' ? 0.55 : rarity === 'uncommon' ? 0.70 : 0.85,
      ...RARITY_COLORS[rarity],
    };
  });
}

export const RARITY_COLORS_MAP = RARITY_COLORS;
export const RARITY_XP_MAP = RARITY_XP;