/**
 * offlineQueue — durable write buffer for the field.
 *
 * When the rockhound is in a canyon with no signal, entity writes (creating a
 * Specimen, logging a verification test, etc.) are encrypted using AES-GCM
 * and stored in localStorage, then flushed automatically when the network returns.
 *
 * This is intentionally tiny and stateless — every consumer just calls
 * `queueWrite(...)` instead of base44.entities.X.create(...) directly. The
 * queue handles retry, ordering, and reconnect.
 */
import { base44 } from "@/api/base44Client";

const STORAGE_KEY = "rh-offline-queue-v1";
const KEY_STORAGE_KEY = "rh-offline-queue-key-v1";

let memoryKey = null;
let cachedQueue = null;

function getCrypto() {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    return window.crypto;
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto;
  }
  return null;
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

const DB_NAME = "rh-offline-queue-keys-v1";
const DB_STORE = "keys";
const DB_KEY_ID = "queue-encryption-key";

function getIndexedDB() {
  if (typeof window !== "undefined" && window.indexedDB) {
    return window.indexedDB;
  }
  if (typeof globalThis !== "undefined" && globalThis.indexedDB) {
    return globalThis.indexedDB;
  }
  return null;
}

function openKeyDatabase() {
  const idb = getIndexedDB();
  if (!idb) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = idb.open(DB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(DB_STORE)) {
          db.createObjectStore(DB_STORE);
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function getKeyFromIDB() {
  const db = await openKeyDatabase();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(DB_STORE, "readonly");
      const store = tx.objectStore(DB_STORE);
      const req = store.get(DB_KEY_ID);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function saveKeyToIDB(key) {
  const db = await openKeyDatabase();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(DB_STORE, "readwrite");
      const store = tx.objectStore(DB_STORE);
      const req = store.put(key, DB_KEY_ID);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

async function getOrCreateKey() {
  if (memoryKey) return memoryKey;
  const cryptoObj = getCrypto();
  if (!cryptoObj) return null;

  try {
    // If a legacy cleartext key exists in localStorage, migrate it to IndexedDB as non-extractable and purge it from localStorage
    const storedKeyRaw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY_STORAGE_KEY) : null;
    if (storedKeyRaw) {
      try {
        const rawKeyBuffer = base64ToBuffer(storedKeyRaw);
        memoryKey = await cryptoObj.subtle.importKey(
          "raw",
          rawKeyBuffer,
          { name: "AES-GCM", length: 256 },
          false,
          ["encrypt", "decrypt"]
        );
        await saveKeyToIDB(memoryKey);
      } catch (err) {
        console.warn("offlineQueue: failed to import legacy key", err);
      } finally {
        try {
          localStorage.removeItem(KEY_STORAGE_KEY);
        } catch { /* ignore */ }
      }
      if (memoryKey) return memoryKey;
    }

    // Try retrieving non-extractable CryptoKey from IndexedDB
    const storedKey = await getKeyFromIDB();
    if (storedKey) {
      memoryKey = storedKey;
      return memoryKey;
    }

    // Generate new non-extractable CryptoKey (extractable: false prevents exportKey)
    memoryKey = await cryptoObj.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    // Save non-extractable CryptoKey in IndexedDB if available
    await saveKeyToIDB(memoryKey);

    return memoryKey;
  } catch (err) {
    console.error("offlineQueue: failed to initialize encryption key", err);
    return null;
  }
}

async function encryptPayload(data) {
  const cryptoObj = getCrypto();
  const key = await getOrCreateKey();
  if (!cryptoObj || !key) {
    return JSON.stringify(data);
  }

  const iv = cryptoObj.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await cryptoObj.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedData
  );

  return JSON.stringify({
    version: 1,
    iv: bufferToBase64(iv),
    data: bufferToBase64(ciphertext),
  });
}

async function decryptPayload(raw) {
  if (!raw) return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (parsed && parsed.version === 1 && parsed.iv && parsed.data) {
    const cryptoObj = getCrypto();
    const key = await getOrCreateKey();
    if (!cryptoObj || !key) {
      console.warn("offlineQueue: Web Crypto unavailable for decryption");
      return [];
    }
    try {
      const iv = new Uint8Array(base64ToBuffer(parsed.iv));
      const ciphertext = base64ToBuffer(parsed.data);
      const decryptedBuffer = await cryptoObj.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext
      );
      const decryptedText = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(decryptedText);
    } catch (err) {
      console.error("offlineQueue: decryption failed", err);
      return [];
    }
  }

  return [];
}

export async function loadQueue() {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      cachedQueue = [];
      return [];
    }
    const items = await decryptPayload(raw);
    cachedQueue = Array.isArray(items) ? items : [];

    let parsedRaw;
    try { parsedRaw = JSON.parse(raw); } catch { /* ignore */ }
    if (Array.isArray(parsedRaw)) {
      await saveQueue(cachedQueue);
    }

    return cachedQueue;
  } catch {
    cachedQueue = [];
    return [];
  }
}

export async function saveQueue(items) {
  cachedQueue = items;
  let batch = items;
  while (batch.length > 0) {
    try {
      const encrypted = await encryptPayload(batch);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, encrypted);
      }
      cachedQueue = batch;
      return;
    } catch {
      batch = batch.slice(Math.ceil(batch.length / 2));
    }
  }
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    cachedQueue = [];
  } catch { /* nothing more we can do */ }
}

const MAX_ATTEMPTS = 5;

let flushing = false;

export async function flushQueue() {
  const currentQueue = await loadQueue();
  if (flushing) return { flushed: 0, remaining: currentQueue.length };
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { flushed: 0, remaining: currentQueue.length };
  }

  flushing = true;
  let flushed = 0;
  try {
    let queue = currentQueue;
    while (queue.length > 0) {
      const next = queue[0];
      try {
        const e = base44.entities[next.entity];
        if (!e) { queue.shift(); continue; }
        if (next.op === "create") {
          await e.create(next.data);
        } else if (next.op === "update") {
          await e.update(next.id, next.data);
        }
        flushed += 1;
        queue.shift();
        await saveQueue(queue);
      } catch (err) {
        const status = err?.status ?? err?.response?.status;
        const attempts = (next.attempts || 0) + 1;
        if ((status && status >= 400 && status < 500) || attempts >= MAX_ATTEMPTS) {
          console.warn("offlineQueue: dropping unsendable write", next.entity, next.op, status);
          queue.shift();
          await saveQueue(queue);
          continue;
        }
        queue[0] = { ...next, attempts };
        await saveQueue(queue);
        break;
      }
    }
    return { flushed, remaining: queue.length };
  } finally {
    flushing = false;
  }
}

/**
 * queueWrite — try the network first; on failure, persist for later replay.
 * Returns { ok, offline, result? } so callers can show optimistic UI.
 */
export async function queueWrite({ entity, op = "create", id, data }) {
  const online = typeof navigator === "undefined" || navigator.onLine !== false;

  if (online) {
    try {
      const e = base44.entities[entity];
      const result = op === "create" ? await e.create(data) : await e.update(id, data);
      return { ok: true, offline: false, result };
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      if (status && status >= 400 && status < 500) {
        throw err;
      }
    }
  }

  const queue = await loadQueue();
  queue.push({ entity, op, id, data, queuedAt: Date.now() });
  await saveQueue(queue);
  if (typeof window !== "undefined") schedulePeriodicRetry();
  return { ok: true, offline: true };
}

export function getQueueLength() {
  if (cachedQueue !== null) {
    return cachedQueue.length;
  }
  return 0;
}

async function isConnectionStable() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
  try {
    const res = await fetch("https://www.gstatic.com/generate_204", {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

export async function flushWhenStable() {
  const queue = await loadQueue();
  if (queue.length === 0) return { flushed: 0, remaining: 0 };
  const stable = await isConnectionStable();
  if (!stable) return { flushed: 0, remaining: queue.length };
  return flushQueue();
}

const PERIODIC_INTERVAL_MS = 30_000;
let retryTimer = null;

function schedulePeriodicRetry() {
  if (retryTimer) return;
  retryTimer = setInterval(async () => {
    const queue = await loadQueue();
    if (queue.length === 0) {
      clearInterval(retryTimer);
      retryTimer = null;
      return;
    }
    await flushWhenStable();
  }, PERIODIC_INTERVAL_MS);
}

let installed = false;
export function installOfflineQueue() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  loadQueue().catch(() => {});

  window.addEventListener("online", () => {
    setTimeout(() => { flushWhenStable(); }, 1500);
  });

  setTimeout(async () => {
    await flushWhenStable();
    const queue = await loadQueue();
    if (queue.length > 0) {
      schedulePeriodicRetry();
    }
  }, 2000);

  window.addEventListener("storage", async (e) => {
    if (e.key === STORAGE_KEY) {
      const queue = await loadQueue();
      if (queue.length > 0) {
        schedulePeriodicRetry();
      }
    }
  });
}

export function _resetQueueStateForTesting() {
  memoryKey = null;
  cachedQueue = null;
}
