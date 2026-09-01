/**
 * cloverMemory.js — Long-Term Episodic Cognitive Memory for Clover.
 *
 * Implements a persistent cognitive buffer tracking:
 * - Visited localities & GPS waypoints
 * - Cataloged minerals & favorite finds
 * - User skill level, preferences, and hunting patterns
 * - Cross-session conversational episodic memory
 */

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
    preferredMode: 'kid', // 'kid' | 'pro'
    totalScans: 0,
    favoriteMinerals: [],
    recentLocalities: [],
    recentDiscoveries: [],
    episodicNotes: [],
    huntingStyle: 'beachcomber', // 'beachcomber' | 'quarry_hunter' | 'mineralogist' | 'casual'
  };
}

/**
 * Record a new mineral discovery into episodic memory.
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

  saveCloverMemory(memory);
}

/**
 * Record a GPS waypoint into memory.
 */
export function recordWaypointToMemory(lat, lng, label = null) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  const memory = loadCloverMemory();
  const waypoint = {
    lat: Number(lat.toFixed(4)),
    lng: Number(lng.toFixed(4)),
    label,
    timestamp: Date.now(),
  };

  memory.recentLocalities = [
    waypoint,
    ...memory.recentLocalities.filter(l => Math.abs(l.lat - lat) > 0.01 || Math.abs(l.lng - lng) > 0.01)
  ].slice(0, 10);

  saveCloverMemory(memory);
}

/**
 * Generates an executive memory summary prompt inject for Clover's reasoning.
 */
export function getCognitiveMemoryContext() {
  const memory = loadCloverMemory();
  const recent = memory.recentDiscoveries.slice(0, 3).map(d => d.mineral).join(', ');
  const favs = memory.favoriteMinerals.slice(0, 3).join(', ');

  let context = `[Cognitive Memory: User has ${memory.totalScans} total discoveries cataloged.`;
  if (recent) context += ` Recent finds: ${recent}.`;
  if (favs) context += ` Prized specimens: ${favs}.`;
  context += ` User mode: ${memory.preferredMode}.]`;

  return context;
}
