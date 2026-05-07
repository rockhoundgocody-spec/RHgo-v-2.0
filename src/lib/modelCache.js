// IndexedDB cache for on-device ML model artifacts.
// Keyed by `${version}::${checksum}` so a re-published version with a new
// build invalidates automatically. No deps. Ready for the day a real
// `.onnx` / `.tflite` URL exists in the MLModel registry.

const DB_NAME = 'rhgo-models';
const STORE = 'artifacts';
const DB_VERSION = 1;

function openDb() {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB not available'));
  }
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

const cacheKey = (version, checksum) => `${version}::${checksum || 'nochecksum'}`;

export async function getCachedModel(version, checksum) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readonly').get(cacheKey(version, checksum));
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function putCachedModel(version, checksum, buffer) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').put(buffer, cacheKey(version, checksum));
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearCachedModels() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// SHA-256 over an ArrayBuffer → hex string. Used to verify a freshly
// downloaded model matches MLModel.checksum before caching.
export async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Fetch + verify + cache. Returns ArrayBuffer.
// Throws if checksum is provided and doesn't match.
export async function fetchAndCacheModel({ version, checksum, cdn_url }) {
  const cached = await getCachedModel(version, checksum);
  if (cached) return cached;

  const res = await fetch(cdn_url);
  if (!res.ok) throw new Error(`Model fetch failed: ${res.status}`);
  const buffer = await res.arrayBuffer();

  if (checksum) {
    const got = await sha256Hex(buffer);
    if (got.toLowerCase() !== checksum.toLowerCase()) {
      throw new Error(`Model checksum mismatch (expected ${checksum}, got ${got})`);
    }
  }

  await putCachedModel(version, checksum, buffer);
  return buffer;
}