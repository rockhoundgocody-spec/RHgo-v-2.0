/**
 * cloverMemory.js — Long-Term Episodic Cognitive Memory for Clover.
 *
 * Implements a persistent cognitive buffer tracking:
 * - Visited localities & GPS waypoints
 * - Cataloged minerals & favorite finds
 * - User skill level, preferences, and hunting patterns
 * - Cross-session conversational episodic memory
 */

const MEMORY_STORAGE_KEY = 'rhgo_clover_memory';

let inMemoryFallback = null;

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
        inMemoryFallback = { ...createDefaultMemory(), ...JSON.parse(raw) };
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
    preferredMode: 'pro', // 'kid' | 'pro'
    totalScans: 0,
    favoriteMinerals: [],
    recentLocalities: [],
    recentDiscoveries: [],
    episodicNotes: [],
    masteredTerms: [],
    quizStreak: 0,
    lastQuizDate: null,
    lastTopic: null,
    lastActiveAt: null,
    huntingStyle: 'beachcomber', // 'beachcomber' | 'quarry_hunter' | 'mineralogist' | 'casual'
  };
}

/**
 * Records a rockhounding term mastered via the daily terminology quiz into
 * Clover's persistent cognitive memory and updates the daily streak.
 */
export function recordMasteredTerm(term, completedDaily = false) {
  if (!term) return getTerminologyMastery();
  const memory = loadCloverMemory();
  const list = Array.isArray(memory.masteredTerms) ? memory.masteredTerms : [];
  if (!list.includes(term)) {
    memory.masteredTerms = [term, ...list].slice(0, 60);
  }
  if (completedDaily) {
    const today = new Date().toISOString().slice(0, 10);
    if (memory.lastQuizDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      memory.quizStreak = memory.lastQuizDate === yesterday ? (memory.quizStreak || 0) + 1 : 1;
      memory.lastQuizDate = today;
    }
  }
  memory.lastTopic = term;
  memory.lastActiveAt = Date.now();
  saveCloverMemory(memory);
  return getTerminologyMastery();
}

export function getTerminologyMastery() {
  const memory = loadCloverMemory();
  const today = new Date().toISOString().slice(0, 10);
  return {
    masteredTerms: Array.isArray(memory.masteredTerms) ? memory.masteredTerms : [],
    masteredCount: Array.isArray(memory.masteredTerms) ? memory.masteredTerms.length : 0,
    quizStreak: memory.quizStreak || 0,
    completedToday: memory.lastQuizDate === today,
  };
}

/**
 * Record a new mineral discovery into episodic memory.
 */
export function recordDiscoveryToMemory(specimen) {
  const mineralName = specimen?.top_match || specimen?.mineral_name;
  if (!mineralName) return;
  const memory = loadCloverMemory();
  memory.totalScans += 1;

  const location = specimen.location_name || specimen.found_at || null;
  const discoveryEntry = {
    mineral: mineralName,
    timestamp: Date.now(),
    rarity: specimen.rarity || 'common',
    location,
  };

  memory.recentDiscoveries = [discoveryEntry, ...memory.recentDiscoveries].slice(0, 20);

  if (location && !memory.recentLocalities.includes(location)) {
    memory.recentLocalities = [location, ...memory.recentLocalities].slice(0, 12);
  }

  if (!memory.favoriteMinerals.includes(mineralName)) {
    if (specimen.rarity === 'rare' || specimen.rarity === 'legendary') {
      memory.favoriteMinerals.push(mineralName);
    }
  }

  memory.lastTopic = mineralName;
  memory.lastActiveAt = Date.now();
  saveCloverMemory(memory);
}

/**
 * Synchronize the user's loaded specimen collection (cloud or guest) into
 * Clover's cognitive memory so cross-session stats and localities stay current.
 */
export function syncCollectionToMemory(specimens = []) {
  if (!Array.isArray(specimens) || specimens.length === 0) return;
  const memory = loadCloverMemory();
  memory.totalScans = Math.max(memory.totalScans || 0, specimens.length);

  for (const s of specimens.slice(0, 25)) {
    const mineral = s.mineral_name || s.common_name;
    const loc = s.found_at || s.location_name;
    if (loc && !memory.recentLocalities.includes(loc)) {
      memory.recentLocalities = [loc, ...memory.recentLocalities].slice(0, 12);
    }
    if (mineral && (s.rarity === 'rare' || s.rarity === 'legendary') && !memory.favoriteMinerals.includes(mineral)) {
      memory.favoriteMinerals = [mineral, ...memory.favoriteMinerals].slice(0, 10);
    }
  }

  if (memory.recentDiscoveries.length === 0) {
    memory.recentDiscoveries = specimens.slice(0, 10).map((s) => ({
      mineral: s.mineral_name || s.common_name || 'Specimen',
      timestamp: Date.now(),
      rarity: s.rarity || 'common',
      location: s.found_at || null,
    }));
  }

  saveCloverMemory(memory);
}

/**
 * Record a conversational exchange into Clover's cross-session episodic memory.
 */
export function recordConversationEpisode({ userText, assistantReply, citedSources = [] } = {}) {
  const u = String(userText || '').trim();
  const a = String(assistantReply || '').trim();
  if (!u && !a) return;

  const memory = loadCloverMemory();
  const citedLabels = Array.isArray(citedSources)
    ? citedSources.map((s) => s?.label).filter(Boolean).slice(0, 2)
    : [];

  const summary = `Asked: "${u.slice(0, 90)}" → Clover: "${a.slice(0, 110)}"${citedLabels.length ? ` [${citedLabels.join(', ')}]` : ''}`;
  memory.episodicNotes = [summary, ...(memory.episodicNotes || []).filter((n) => n !== summary)].slice(0, 8);

  if (citedLabels[0]) {
    memory.lastTopic = citedLabels[0];
  }
  for (const src of citedSources || []) {
    if (src?.place && !memory.recentLocalities.includes(src.place)) {
      memory.recentLocalities = [src.place, ...memory.recentLocalities].slice(0, 12);
    }
  }
  memory.lastActiveAt = Date.now();
  saveCloverMemory(memory);
}

/**
 * Generates an executive memory summary prompt inject for Clover's reasoning.
 */
export function getCognitiveMemoryContext() {
  const memory = loadCloverMemory();
  const recent = (memory.recentDiscoveries || [])
    .slice(0, 4)
    .map((d) => (d.location ? `${d.mineral} (${d.location})` : d.mineral))
    .join(', ');
  const favs = (memory.favoriteMinerals || []).slice(0, 4).join(', ');
  const locs = (memory.recentLocalities || []).slice(0, 4).join(', ');
  const notes = (memory.episodicNotes || []).slice(0, 3).join(' | ');

  let context = `[Cognitive Memory: User has ${memory.totalScans} total discoveries cataloged.`;
  if (recent) context += ` Recent finds: ${recent}.`;
  if (favs) context += ` Prized specimens: ${favs}.`;
  if (locs) context += ` Visited localities: ${locs}.`;
  if (memory.lastTopic) context += ` Last focus: ${memory.lastTopic}.`;
  if (Array.isArray(memory.masteredTerms) && memory.masteredTerms.length > 0) {
    context += ` Mastered field terms (${memory.masteredTerms.length}): ${memory.masteredTerms.slice(0, 8).join(', ')}.`;
  }
  if (notes) context += ` Past conversation notes: ${notes}.`;
  context += ` User mode: ${memory.preferredMode}.]`;

  return context;
}