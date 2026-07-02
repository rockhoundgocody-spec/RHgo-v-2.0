// Badge catalog + earning rules. Pure functions — no side effects.

const uniqueMinerals = (s) => {
  const set = new Set();
  for (const x of s) {
    const val = (x.mineral_name || '').toLowerCase().trim();
    if (val) set.add(val);
  }
  return set.size;
};
const uniqueLocations = (s) => {
  const set = new Set();
  for (const x of s) {
    const val = (x.found_at || '').toLowerCase().trim();
    if (val) set.add(val);
  }
  return set.size;
};
const maxFindsAtSpot  = (s) => {
  const c = {}; for (const x of s) { const l = (x.found_at||'').toLowerCase().trim(); if (l) c[l]=(c[l]||0)+1; }
  return Math.max(0, ...Object.values(c));
};
const streakDays = (s) => {
  const datesSet = new Set();
  for (const x of s) {
    const d = (x.found_date || x.created_date || '').slice(0, 10);
    if (d) datesSet.add(d);
  }
  const dates = [...datesSet].sort();
  let best = 1, cur = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i]) - new Date(dates[i-1])) / 86400000;
    cur = diff === 1 ? cur + 1 : 1;
    best = Math.max(best, cur);
  }
  return dates.length ? best : 0;
};

export const BADGES = [
  // ── RARITY COLLECTION: unlock by collecting minerals of each rarity tier ──
  {
    code: 'rarity_common', title: 'Stone Signer',
    description: 'Collect your first common mineral.',
    rarity: 'common', icon: 'Gem', material: 'natural_stone', colorScheme: 'slate',
    check: s => s.some(x => x.rarity === 'common'),
    progress: s => ({ current: Math.min(s.filter(x => x.rarity === 'common').length, 1), target: 1 }),
  },
  {
    code: 'rarity_uncommon', title: 'Uncommon Eye',
    description: 'Collect your first uncommon mineral.',
    rarity: 'uncommon', icon: 'Sparkles', material: 'liquid_glass', colorScheme: 'teal',
    check: s => s.some(x => x.rarity === 'uncommon'),
    progress: s => ({ current: Math.min(s.filter(x => x.rarity === 'uncommon').length, 1), target: 1 }),
  },
  {
    code: 'rarity_rare', title: 'Rare Hunter',
    description: 'Collect your first rare mineral.',
    rarity: 'rare', icon: 'Diamond', material: 'crystal_core', colorScheme: 'cyan',
    check: s => s.some(x => x.rarity === 'rare'),
    progress: s => ({ current: Math.min(s.filter(x => x.rarity === 'rare').length, 1), target: 1 }),
  },
  {
    code: 'rarity_legendary', title: 'Legendary Finder',
    description: 'Collect your first legendary mineral.',
    rarity: 'legendary', icon: 'Crown', material: 'crystal_core', colorScheme: 'gold',
    check: s => s.some(x => x.rarity === 'legendary'),
    progress: s => ({ current: Math.min(s.filter(x => x.rarity === 'legendary').length, 1), target: 1 }),
  },

  // ── TIER 1: FIRST STEPS ──────────────────────────────────────────────────
  {
    code: 'first_find', title: 'Crystal Whisperer',
    description: 'Find your first rare crystal.',
    rarity: 'common', icon: 'Gem', material: 'liquid_glass', colorScheme: 'amethyst',
    check: s => s.length >= 1,
    progress: s => ({ current: Math.min(s.length, 1), target: 1 }),
  },
  {
    code: 'sharp_eye', title: 'Sharp Eye',
    description: 'AI-identify 10 specimens correctly with 80%+ confidence.',
    rarity: 'common', icon: 'Eye', material: 'natural_stone', colorScheme: 'teal',
    check: s => s.filter(x => (x.ai_confidence||0) >= 0.8).length >= 10,
    progress: s => ({ current: Math.min(s.filter(x=>(x.ai_confidence||0)>=0.8).length,10), target: 10 }),
  },
  {
    code: 'pocket_finder', title: 'Pocket Finder',
    description: 'Find 20 pocket gems (small specimens).',
    rarity: 'common', icon: 'Package', material: 'metallic_inlay', colorScheme: 'gold',
    check: s => s.length >= 20,
    progress: s => ({ current: Math.min(s.length, 20), target: 20 }),
  },

  // ── TIER 2: EXPLORER ─────────────────────────────────────────────────────
  {
    code: 'trailblazer', title: 'Trailblazer',
    description: 'Explore 25 different sites.',
    rarity: 'uncommon', icon: 'Footprints', material: 'geo_topo', colorScheme: 'copper',
    check: s => uniqueLocations(s) >= 25,
    progress: s => ({ current: Math.min(uniqueLocations(s), 25), target: 25 }),
  },
  {
    code: 'verified_eye', title: 'Verified Eye',
    description: 'Verify your first specimen.',
    rarity: 'uncommon', icon: 'CheckCircle2', material: 'liquid_glass', colorScheme: 'cyan',
    check: s => s.some(x => x.verified === true),
    progress: s => ({ current: Math.min(s.filter(x=>x.verified===true).length,1), target: 1 }),
  },
  {
    code: 'memory_builder', title: 'Memory Builder',
    description: 'Create 5 memory capsules (specimens with detailed notes).',
    rarity: 'uncommon', icon: 'BookOpen', material: 'natural_stone', colorScheme: 'slate',
    check: s => s.filter(x => (x.notes||'').length > 20).length >= 5,
    progress: s => ({ current: Math.min(s.filter(x=>(x.notes||'').length>20).length,5), target: 5 }),
  },
  {
    code: 'vein_tracker', title: 'Vein Tracker',
    description: 'Follow 3 mineral veins — find 5 of the same mineral type.',
    rarity: 'uncommon', icon: 'GitBranch', material: 'geo_topo', colorScheme: 'ruby',
    check: s => { const c={}; for(const x of s){const m=(x.mineral_name||'').toLowerCase().trim(); if(m)c[m]=(c[m]||0)+1;} return Object.values(c).some(v=>v>=5); },
    progress: s => { const c={}; for(const x of s){const m=(x.mineral_name||'').toLowerCase().trim(); if(m)c[m]=(c[m]||0)+1;} const b=Math.max(0,...Object.values(c)); return {current:Math.min(b,5),target:5}; },
  },

  // ── TIER 3: SEEKER ───────────────────────────────────────────────────────
  {
    code: 'archivist_25', title: 'Master of Stone',
    description: 'Collect 250 specimens.',
    rarity: 'rare', icon: 'Library', material: 'crystal_core', colorScheme: 'violet',
    check: s => s.length >= 250,
    progress: s => ({ current: Math.min(s.length, 250), target: 250 }),
  },
  {
    code: 'rare_seeker', title: 'Rare Seeker',
    description: 'Find 5 rare or legendary specimens.',
    rarity: 'rare', icon: 'Sparkles', material: 'metallic_inlay', colorScheme: 'amber',
    check: s => s.filter(x=>x.rarity==='rare'||x.rarity==='legendary').length >= 5,
    progress: s => ({ current: Math.min(s.filter(x=>x.rarity==='rare'||x.rarity==='legendary').length,5), target: 5 }),
  },
  {
    code: 'pathfinder', title: 'Pathfinder',
    description: 'Explore 50 unique collecting sites.',
    rarity: 'rare', icon: 'Map', material: 'liquid_glass', colorScheme: 'jade',
    check: s => uniqueLocations(s) >= 50,
    progress: s => ({ current: Math.min(uniqueLocations(s), 50), target: 50 }),
  },
  {
    code: 'shared_adventure', title: 'Shared Adventure',
    description: 'Complete your first family trip — share 3 verified finds.',
    rarity: 'rare', icon: 'Share2', material: 'natural_stone', colorScheme: 'teal',
    check: s => s.filter(x=>x.verified===true).length >= 3,
    progress: s => ({ current: Math.min(s.filter(x=>x.verified===true).length,3), target: 3 }),
  },

  // ── TIER 4: MASTER ───────────────────────────────────────────────────────
  {
    code: 'mineralogist', title: 'Crystal Whisperer II',
    description: 'Identify 10 unique mineral types.',
    rarity: 'epic', icon: 'Hexagon', material: 'crystal_core', colorScheme: 'amethyst',
    check: s => uniqueMinerals(s) >= 10,
    progress: s => ({ current: Math.min(uniqueMinerals(s), 10), target: 10 }),
  },
  {
    code: 'globetrotter', title: 'Cartographer',
    description: 'Explore 100 unique sites.',
    rarity: 'epic', icon: 'Globe', material: 'geo_topo', colorScheme: 'ocean',
    check: s => uniqueLocations(s) >= 100,
    progress: s => ({ current: Math.min(uniqueLocations(s), 100), target: 100 }),
  },
  {
    code: 'perfect_strike', title: 'Perfect Strike',
    description: '10 correct AI identifications in a row (90%+ confidence streak).',
    rarity: 'epic', icon: 'Target', material: 'liquid_glass', colorScheme: 'violet',
    check: s => {
      const sorted = [...s].sort((a,b)=>new Date(a.created_date||0)-new Date(b.created_date||0));
      let streak=0,best=0; for(const x of sorted){if((x.ai_confidence||0)>=0.9){streak++;best=Math.max(best,streak);}else{streak=0;}} return best>=10;
    },
    progress: s => {
      const sorted = [...s].sort((a,b)=>new Date(a.created_date||0)-new Date(b.created_date||0));
      let streak=0,best=0; for(const x of sorted){if((x.ai_confidence||0)>=0.9){streak++;best=Math.max(best,streak);}else{streak=0;}} return {current:Math.min(best,10),target:10};
    },
  },
  {
    code: 'apex_hunter', title: 'Apex Hunter',
    description: 'Complete a 7-day logging streak.',
    rarity: 'epic', icon: 'Zap', material: 'metallic_inlay', colorScheme: 'gold',
    check: s => streakDays(s) >= 7,
    progress: s => ({ current: Math.min(streakDays(s), 7), target: 7 }),
  },

  // ── TIER 5: LEGEND ───────────────────────────────────────────────────────
  {
    code: 'earth_chosen', title: 'Earth Chosen',
    description: 'Find your first legendary specimen.',
    rarity: 'legendary', icon: 'Crown', material: 'crystal_core', colorScheme: 'gold',
    check: s => s.some(x => x.rarity === 'legendary'),
    progress: s => ({ current: Math.min(s.filter(x=>x.rarity==='legendary').length,1), target: 1 }),
  },
  {
    code: 'legend_of_lode', title: 'Legend of the Lode',
    description: 'Discover a new mineral variant — reach 50 unique mineral types.',
    rarity: 'legendary', icon: 'Mountain', material: 'geo_topo', colorScheme: 'amethyst',
    check: s => uniqueMinerals(s) >= 50,
    progress: s => ({ current: Math.min(uniqueMinerals(s), 50), target: 50 }),
  },
  {
    code: 'hotspot_master', title: 'Master of Stone II',
    description: 'Log 10 finds from the same location.',
    rarity: 'legendary', icon: 'Star', material: 'metallic_inlay', colorScheme: 'amber',
    check: s => maxFindsAtSpot(s) >= 10,
    progress: s => ({ current: Math.min(maxFindsAtSpot(s), 10), target: 10 }),
  },
];

export const getBadgeDefinition = code => BADGES.find(b => b.code === code);
export const evaluateEarnedCodes = specimens => BADGES.filter(b => b.check(specimens||[])).map(b => b.code);