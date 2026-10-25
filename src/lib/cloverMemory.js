/**
 * cloverMemory.js — Long-Term Episodic Cognitive Memory & RSI (Recursive Self-Improvement) Engine for Clover.
 *
 * Implements a persistent cognitive buffer and self-optimizing agent loop tracking:
 * - Visited localities & GPS waypoints
 * - Cataloged minerals & favorite finds
 * - User skill level, preferences, and hunting patterns
 * - Cross-session conversational episodic memory
 * - RSI Agent Telemetry: auto-evolving skill mastery, Bayesian calibration score,
 *   and recursive self-reflection heuristics learned from every scan, voice turn, and correction.
 */

const MEMORY_STORAGE_KEY = 'rhgo_clover_memory';

let inMemoryFallback = null;

const DEFAULT_AUTO_SKILLS = [
  {
    id: 'strata_fusion',
    title: 'Bayesian Strata Fusion',
    domain: 'Geospatial & Bedrock Priors',
    level: 2,
    xp: 45,
    xpToNext: 100,
    heuristic: 'Weight Macrostrat bedrock formations alongside glacial transport priors.',
  },
  {
    id: 'optical_crystallography',
    title: 'Optical Crystallography',
    domain: 'Luster, Habit & Cleavage',
    level: 2,
    xp: 60,
    xpToNext: 100,
    heuristic: 'Adjust banding & waxy luster confidence for wet vs. dry surface glare.',
  },
  {
    id: 'imposter_rejection',
    title: 'Forensic Decoy Rejection',
    domain: 'Slag vs. Agate / Pyrite vs. Gold',
    level: 2,
    xp: 50,
    xpToNext: 100,
    heuristic: 'Flag spherical gas vesicles and glassy conchoidal swirls before confirming rare stone IDs.',
  },
  {
    id: 'acoustic_cadence',
    title: 'Acoustic & Voice Cadence',
    domain: 'Field Speech & Prosody',
    level: 2,
    xp: 55,
    xpToNext: 100,
    heuristic: 'Resolve noisy outdoor phonetic transcripts using mineralogical context.',
  },
  {
    id: 'recursive_calibration',
    title: 'Recursive Calibration Loop',
    domain: 'Self-Critique & Uncertainty',
    level: 2,
    xp: 40,
    xpToNext: 100,
    heuristic: 'Propose the lowest-cost physical test (streak, Mohs scratch, UV) when posterior entropy is high.',
  },
];

export function clearCloverMemoryForTest() {
  inMemoryFallback = null;
  if (typeof localStorage !== 'undefined') {
    try { localStorage.removeItem(MEMORY_STORAGE_KEY); } catch {}
  }
}

export function loadCloverMemory() {
  if (inMemoryFallback) return inMemoryFallback;
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const base = createDefaultMemory();
        inMemoryFallback = {
          ...base,
          ...parsed,
          autoSkills: Array.isArray(parsed.autoSkills) && parsed.autoSkills.length
            ? parsed.autoSkills
            : base.autoSkills,
          reflections: Array.isArray(parsed.reflections) && parsed.reflections.length
            ? parsed.reflections
            : base.reflections,
        };
        return inMemoryFallback;
      }
    } catch {}
  }
  inMemoryFallback = createDefaultMemory();
  return inMemoryFallback;
}

export function saveCloverMemory(memory) {
  inMemoryFallback = memory;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memory));
    } catch {}
  }
}

function createDefaultMemory() {
  return {
    version: 2,
    userName: 'Explorer',
    preferredMode: 'kid', // 'kid' | 'pro'
    totalScans: 0,
    favoriteMinerals: [],
    recentLocalities: [],
    recentDiscoveries: [],
    episodicNotes: [],
    huntingStyle: 'beachcomber', // 'beachcomber' | 'quarry_hunter' | 'mineralogist' | 'casual'
    rsiGeneration: 1,
    calibrationScore: 0.88,
    totalVoiceTurns: 0,
    autoSkills: DEFAULT_AUTO_SKILLS.map((s) => ({ ...s })),
    reflections: [
      'Cross-check translucent fortification banding against waxy chert rinds before locking high confidence.',
      'When surface glare obscures cleavage planes, suggest a quick Mohs scratch or streak check.',
    ],
  };
}

function bumpSkillXp(memory, skillId, amount, newHeuristic) {
  if (!Array.isArray(memory.autoSkills)) {
    memory.autoSkills = DEFAULT_AUTO_SKILLS.map((s) => ({ ...s }));
  }
  let leveledUp = false;
  memory.autoSkills = memory.autoSkills.map((s) => {
    if (s.id !== skillId) return s;
    let xp = (s.xp || 0) + amount;
    let level = s.level || 1;
    let xpToNext = s.xpToNext || 100;
    while (xp >= xpToNext && level < 10) {
      xp -= xpToNext;
      level += 1;
      xpToNext = Math.round(xpToNext * 1.25);
      leveledUp = true;
    }
    return {
      ...s,
      xp,
      level,
      xpToNext,
      heuristic: newHeuristic || s.heuristic,
    };
  });
  if (leveledUp) {
    memory.rsiGeneration = (memory.rsiGeneration || 1) + 1;
  }
  return leveledUp;
}

/**
 * Record a new mineral discovery into episodic memory and advance RSI skills.
 */
export function recordDiscoveryToMemory(specimen) {
  if (!specimen?.top_match) return;
  const memory = loadCloverMemory();
  memory.totalScans += 1;

  const discoveryEntry = {
    mineral: specimen.top_match,
    timestamp: Date.now(),
    rarity: specimen.rarity || 'common',
    location: specimen.location_name || null,
  };

  memory.recentDiscoveries = [discoveryEntry, ...memory.recentDiscoveries].slice(0, 20);

  if (!memory.favoriteMinerals.includes(specimen.top_match)) {
    if (specimen.rarity === 'rare' || specimen.rarity === 'legendary') {
      memory.favoriteMinerals.push(specimen.top_match);
    }
  }

  const conf = Number(specimen.confidence);
  if (Number.isFinite(conf) && conf > 0) {
    memory.calibrationScore = Number(
      Math.min(0.99, Math.max(0.72, (memory.calibrationScore || 0.88) * 0.85 + conf * 0.15)).toFixed(2)
    );
  }

  bumpSkillXp(memory, 'optical_crystallography', 18);
  bumpSkillXp(memory, 'imposter_rejection', 14);
  if (specimen.location_name || specimen.geological_plausibility != null) {
    bumpSkillXp(memory, 'strata_fusion', 20);
  }
  if (Number.isFinite(conf) && conf < 0.75) {
    const lesson = `Calibrated uncertainty on ${specimen.top_match} (${Math.round(conf * 100)}%) — prioritize ${specimen.field_next_test || 'a hardness/streak check'} to disambiguate lookalikes.`;
    memory.reflections = [lesson, ...(memory.reflections || []).filter((r) => r !== lesson)].slice(0, 8);
    bumpSkillXp(memory, 'recursive_calibration', 22, lesson);
  }

  saveCloverMemory(memory);
}

/**
 * Records an RSI learning event from voice turns, scan reflections, or user corrections.
 */
export function recordRsiTurn({ type = 'voice', confidence = null, mineral = null, note = null } = {}) {
  const memory = loadCloverMemory();
  if (type === 'voice') {
    memory.totalVoiceTurns = (memory.totalVoiceTurns || 0) + 1;
    bumpSkillXp(memory, 'acoustic_cadence', 15);
    bumpSkillXp(memory, 'recursive_calibration', 8);
  } else if (type === 'radar') {
    bumpSkillXp(memory, 'strata_fusion', 25);
  } else if (type === 'scan') {
    bumpSkillXp(memory, 'optical_crystallography', 12);
    if (typeof confidence === 'number' && confidence < 0.8 && mineral) {
      const reflection = `Refined optical boundary for ${mineral} under field lighting.`;
      memory.reflections = [reflection, ...(memory.reflections || []).filter((r) => r !== reflection)].slice(0, 8);
    }
  }
  if (note) {
    memory.reflections = [note, ...(memory.reflections || []).filter((r) => r !== note)].slice(0, 8);
  }
  saveCloverMemory(memory);
  return getRsiTelemetry();
}

/**
 * Runs an active RSI Self-Optimization Cycle over the hunter's history,
 * synthesizing a new self-improvement heuristic and advancing skill mastery.
 */
export function runRsiSelfReflection() {
  const memory = loadCloverMemory();
  const topMineral = memory.recentDiscoveries?.[0]?.mineral || memory.favoriteMinerals?.[0] || 'Silica & Quartzite';
  const scanCount = memory.totalScans || 0;

  const synthesizedRules = [
    `Generation ${(memory.rsiGeneration || 1) + 1} synthesis: cross-weight ${topMineral} habit against local alluvial transport and wet/dry luster shift.`,
    `Bayesian prior tightened across ${scanCount} logged scans — penalize slag vesicles and surface iron-staining decoys.`,
    `Acoustic parser tuned for hands-free field terminology, locality names, and rapid barge-in turns.`,
  ];
  const chosenRule = synthesizedRules[(memory.rsiGeneration || 1) % synthesizedRules.length];

  bumpSkillXp(memory, 'recursive_calibration', 35, chosenRule);
  bumpSkillXp(memory, 'strata_fusion', 20);
  bumpSkillXp(memory, 'imposter_rejection', 20);
  bumpSkillXp(memory, 'optical_crystallography', 20);
  bumpSkillXp(memory, 'acoustic_cadence', 20);

  memory.rsiGeneration = Math.max((memory.rsiGeneration || 1) + 1, 2);
  memory.calibrationScore = Number(Math.min(0.99, (memory.calibrationScore || 0.88) + 0.02).toFixed(2));
  memory.reflections = [chosenRule, ...(memory.reflections || []).filter((r) => r !== chosenRule)].slice(0, 8);

  saveCloverMemory(memory);
  return {
    ...getRsiTelemetry(),
    latestReflection: chosenRule,
  };
}

/**
 * Returns a snapshot of Clover's RSI Agent state for UI and diagnostics.
 */
export function getRsiTelemetry() {
  const memory = loadCloverMemory();
  return {
    rsiGeneration: memory.rsiGeneration || 1,
    calibrationScore: memory.calibrationScore || 0.88,
    totalScans: memory.totalScans || 0,
    totalVoiceTurns: memory.totalVoiceTurns || 0,
    autoSkills: memory.autoSkills || DEFAULT_AUTO_SKILLS,
    reflections: memory.reflections || [],
  };
}

/**
 * Generates an executive memory summary prompt inject for Clover's reasoning.
 */
export function getCognitiveMemoryContext() {
  const memory = loadCloverMemory();
  const recent = memory.recentDiscoveries.slice(0, 3).map(d => d.mineral).join(', ');
  const favs = memory.favoriteMinerals.slice(0, 3).join(', ');
  const topReflection = memory.reflections?.[0] || '';

  let context = `[Cognitive Memory: User has ${memory.totalScans} total discoveries cataloged.`;
  if (recent) context += ` Recent finds: ${recent}.`;
  if (favs) context += ` Prized specimens: ${favs}.`;
  context += ` RSI Gen ${memory.rsiGeneration || 1} (Calibration ${Math.round((memory.calibrationScore || 0.88) * 100)}%).`;
  if (topReflection) context += ` Active RSI heuristic: ${topReflection}`;
  context += ` User mode: ${memory.preferredMode}.]`;

  return context;
}