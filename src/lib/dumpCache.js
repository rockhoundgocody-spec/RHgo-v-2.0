/**
 * dumpAllCaches — clears every client-side cache so the app re-fetches fresh data.
 *
 * Clears:
 *   1. React Query in-memory cache (entity lists, mutations)
 *   2. IndexedDB: rockhound-offline  (offline entity cache)
 *   3. IndexedDB: rhgo-models        (ML model artifacts)
 *   4. IndexedDB: rockhound-images    (specimen photo cache)
 *   5. localStorage app caches (scan counters, etc.) — preserves auth tokens,
 *      offline write queue, and user preferences (voice, kid mode).
 *
 * Does NOT clear:
 *   - Auth tokens (b44_*)  — would force re-login
 *   - Offline write queue (rh-offline-queue-v1) — would lose unsynced field data
 *   - User prefs (clover_voice, rhgo_clover_voice, rhgo_kid_mode) — UX settings
 */
import { queryClientInstance } from '@/lib/query-client';
import { clearCachedModels } from '@/lib/modelCache';

const INDEXED_DB_NAMES = ['rockhound-offline', 'rockhound-images'];

// localStorage keys that are safe to wipe (ephemeral caches / counters only)
const LS_CACHE_PREFIXES = ['rhgo_scans_', 'rh_offline_hotspots'];
const LS_CACHE_KEYS = ['rhgo_intro_seen', 'rhgo_onboarding_complete', 'rhgo_hub_first_visit'];

function deleteIndexedDB(name) {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(name);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
      // onblocked fires if connections are still open — treat as soft fail
      req.onblocked = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

function clearLocalStorageCaches() {
  try {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (LS_CACHE_PREFIXES.some((p) => key.startsWith(p)) || LS_CACHE_KEYS.includes(key)) {
        toRemove.push(key);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
    return toRemove.length;
  } catch {
    return 0;
  }
}

export async function dumpAllCaches() {
  const results = {
    reactQuery: false,
    models: false,
    offline: false,
    images: false,
    localStorageCleared: 0,
  };

  // 1. React Query in-memory cache
  try {
    queryClientInstance.clear();
    results.reactQuery = true;
  } catch {}

  // 2. ML model artifacts (has its own clear function)
  try {
    await clearCachedModels();
    results.models = true;
  } catch {}

  // 3 & 4. Offline entity cache + image cache (delete entire databases)
  const [offline, images] = await Promise.all(
    INDEXED_DB_NAMES.map((name) => deleteIndexedDB(name))
  );
  results.offline = offline;
  results.images = images;

  // 5. Ephemeral localStorage caches
  results.localStorageCleared = clearLocalStorageCaches();

  return results;
}