/**
 * Image Caching System
 * 
 * Manages IndexedDB-based image caching for offline access + performance.
 * Automatically generates thumbnails, stores progressive JPEG streams.
 */

const DB_NAME = 'rockhound-images';
const STORE_NAME = 'specimen-photos';
const VERSION = 1;

let db = null;

/**
 * Initialize IndexedDB
 */
async function initDB() {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('specimen_id', 'specimen_id', { unique: false });
        store.createIndex('url', 'url', { unique: true });
        store.createIndex('cached_at', 'cached_at', { unique: false });
      }
    };
  });
}

/**
 * Cache an image from URL
 * Generates thumbnail via canvas
 */
export async function cacheImage(image_url, specimen_id) {
  const db = await initDB();

  // Check if already cached
  const existing = await new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE_NAME)
      .objectStore(STORE_NAME)
      .index('url')
      .get(image_url);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (existing) return existing;

  // Fetch image
  const response = await fetch(image_url);
  const blob = await response.blob();

  // Generate thumbnail (200x200px)
  const thumbnail = await generateThumbnail(blob);

  // Store in IndexedDB
  const cacheEntry = {
    id: `${specimen_id}-${Date.now()}`,
    specimen_id,
    url: image_url,
    full_blob: blob,
    thumbnail_blob: thumbnail,
    cached_at: new Date().toISOString(),
    size_kb: Math.round(blob.size / 1024),
  };

  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).add(cacheEntry);
    request.onsuccess = () => resolve(cacheEntry);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get cached image (full or thumbnail)
 */
export async function getCachedImage(image_url, size = 'full') {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE_NAME)
      .objectStore(STORE_NAME)
      .index('url')
      .get(image_url);

    request.onsuccess = () => {
      const entry = request.result;
      if (entry) {
        const blob = size === 'thumbnail' ? entry.thumbnail_blob : entry.full_blob;
        const url = URL.createObjectURL(blob);
        resolve(url);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * List cached images for a specimen
 */
export async function getSpecimenImageCache(specimen_id) {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE_NAME)
      .objectStore(STORE_NAME)
      .index('specimen_id')
      .getAll(specimen_id);

    request.onsuccess = () => {
      resolve(request.result.map((entry) => ({ url: entry.url, cached_at: entry.cached_at })));
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear old cached images (>7 days old)
 */
export async function pruneCachedImages(daysOld = 7) {
  const db = await initDB();
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

  return new Promise((resolve, reject) => {
    const allRequest = db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();

    allRequest.onsuccess = () => {
      const toDelete = allRequest.result.filter((entry) => new Date(entry.cached_at) < cutoff);
      const tx = db.transaction(STORE_NAME, 'readwrite');

      toDelete.forEach((entry) => {
        tx.objectStore(STORE_NAME).delete(entry.id);
      });

      tx.oncomplete = () => resolve({ deleted: toDelete.length });
      tx.onerror = () => reject(tx.error);
    };
    allRequest.onerror = () => reject(allRequest.error);
  });
}

/**
 * Generate thumbnail from image blob
 */
async function generateThumbnail(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 200;
        canvas.height = 200;

        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;

        ctx.drawImage(img, x, y, size, size, 0, 0, 200, 200);

        canvas.toBlob((thumbBlob) => {
          resolve(thumbBlob);
        }, 'image/jpeg', 0.8);
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(blob);
  });
}

/**
 * Get cache size (in KB)
 */
export async function getCacheSizeKB() {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();

    request.onsuccess = () => {
      const totalKB = request.result.reduce((sum, entry) => sum + (entry.size_kb || 0), 0);
      resolve(totalKB);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all cached images
 */
export async function clearImageCache() {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).clear();

    request.onsuccess = () => resolve({ cleared: true });
    request.onerror = () => reject(request.error);
  });
}