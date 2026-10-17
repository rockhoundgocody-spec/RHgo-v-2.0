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
import { withSessionTimeout } from '@/lib/sessionTimeout';

const STORAGE_KEY = "rh-offline-queue-v1";
const KEY_STORAGE_KEY = "rh-offline-queue-key-v1";

let memoryKey = null;
let memoryKeyRaw = null;
let cachedQueue = null;
let mutation = Promise.resolve();
function serializeQueue(work) {
  const result = mutation.then(work);
  mutation = result.catch(() => {});
  return result;
}

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

async function getOrCreateKey() {
  const storedKey = localStorage.getItem(KEY_STORAGE_KEY);
  if (memoryKey && storedKey === memoryKeyRaw) return memoryKey;
  memoryKey = null;
  const cryptoObj = getCrypto();
  if (!cryptoObj) return null;

  try {
    const storedKeyRaw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY_STORAGE_KEY) : null;
    if (storedKeyRaw) {
      const rawKeyBuffer = base64ToBuffer(storedKeyRaw);
      memoryKey = await cryptoObj.subtle.importKey(
        "raw",
        rawKeyBuffer,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
      memoryKeyRaw = storedKeyRaw;
      return memoryKey;
    }

    if (localStorage.getItem(STORAGE_KEY) && !Array.isArray(JSON.parse(localStorage.getItem(STORAGE_KEY)))) {
      throw new Error('The offline encryption key is missing. Existing pending finds have been preserved.');
    }
    memoryKey = await cryptoObj.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    const exportedKey = await cryptoObj.subtle.exportKey("raw", memoryKey);
    const keyBase64 = bufferToBase64(exportedKey);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(KEY_STORAGE_KEY, keyBase64);
      memoryKeyRaw = keyBase64;
    }
    return memoryKey;
  } catch (err) {
    memoryKey = null;
    throw new Error('Offline storage could not be secured. Your existing pending finds have not been removed.');
  }
}

async function encryptPayload(data) {
  const cryptoObj = getCrypto();
  const key = await getOrCreateKey();
  if (!cryptoObj || !key) {
    throw new Error('Encrypted offline storage is unavailable. This find has not been saved.');
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
    throw new Error('Pending finds could not be read. The stored queue has been preserved.');
  }

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (parsed && parsed.version === 1 && parsed.iv && parsed.data) {
    const cryptoObj = getCrypto();
    const key = await getOrCreateKey();
    if (!cryptoObj || !key) {
      throw new Error('Pending finds cannot be unlocked on this device. The stored queue has been preserved.');
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
      throw new Error('Pending finds could not be decrypted. The stored queue has been preserved.');
    }
  }

  throw new Error('Pending finds have an unknown storage format. The stored queue has been preserved.');
}

export async function loadQueue() {
  if (typeof localStorage === 'undefined') throw new Error('Offline storage is unavailable.');
  const raw = localStorage.getItem(STORAGE_KEY);
  const items = raw ? await decryptPayload(raw) : [];
  if (!Array.isArray(items)) throw new Error('Pending finds could not be read. The stored queue has been preserved.');
  cachedQueue = structuredClone(items);
  return structuredClone(items);
}

export async function saveQueue(items) {
  if (typeof localStorage === 'undefined') throw new Error('Offline storage is unavailable. This find was not saved.');
  const encrypted = await encryptPayload(items);
  try {
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch {
    throw new Error('Device storage is full or blocked. This find was not saved; existing pending finds are intact.');
  }
  cachedQueue = structuredClone(items);
}

let flushing = false;

export function flushQueue() {
  return serializeQueue(async () => {
    const queue = await loadQueue();
    if (flushing || (typeof navigator !== 'undefined' && navigator.onLine === false)) return { flushed: 0, remaining: queue.length };
    flushing = true;
    let flushed = 0;
    try {
      let user;
      try { user = await withSessionTimeout(base44.auth.me()); } catch { return { flushed: 0, remaining: queue.length }; }
      if (!user?.id) return { flushed: 0, remaining: queue.length };
      // Legacy entries have no trustworthy owner. Retain them rather than replaying under a different account.
      for (let index = 0; index < queue.length;) {
        const next = queue[index];
        if (next.ownerId !== user.id) { index += 1; continue; }
        try {
          const entity = base44.entities[next.entity];
          if (!entity || !['create', 'update'].includes(next.op)) throw Object.assign(new Error('Unsupported queued write'), { status: 400 });
          if (next.op === 'create') {
            await entity.create(next.data);
          } else {
            if (next.baseUpdatedDate && await changedSince(entity, next.id, next.baseUpdatedDate)) {
              throw Object.assign(new Error('Changed on another device'), { status: 409 });
            }
            await entity.update(next.id, next.data);
          }
        } catch (error) {
          const status = error?.status ?? error?.response?.status;
          const rejected = status >= 400 && status < 500;
          queue[index] = {
            ...next,
            attempts: (next.attempts || 0) + 1,
            lastError: status === 409 ? 'Changed on another device — not overwritten' : status ? `Sync failed (${status})` : 'Sync did not finish',
          };
          await saveQueue(queue);
          // A write the server refused is kept for the user but must not hold
          // every later find hostage; a network failure stops the pass.
          if (rejected) { index += 1; continue; }
          break;
        }
        queue.splice(index, 1);
        await saveQueue(queue);
        flushed += 1;
      }
      return { flushed, remaining: queue.length };
    } finally { flushing = false; }
  });
}

/** True when the stored record was edited after the version the queued update was based on. */
async function changedSince(entity, id, baseUpdatedDate) {
  const rows = await entity.filter({ id }, '-updated_date', 1);
  const current = rows?.[0];
  if (!current) throw Object.assign(new Error('Record no longer exists'), { status: 404 });
  const remote = Date.parse(current.updated_date);
  const base = Date.parse(baseUpdatedDate);
  return Number.isFinite(remote) && Number.isFinite(base) && remote > base;
}

/**
 * queueWrite — try the network first; on failure, persist for later replay.
 * Returns { ok, offline, result? } so callers can show optimistic UI.
 *
 * For updates, pass `baseUpdatedDate` (the record's updated_date when the user
 * started editing). A queued update is then never replayed over a newer edit
 * made on another device; it stays in the queue flagged as a conflict.
 */
export async function queueWrite({ entity, op = "create", id, data, ownerId, baseUpdatedDate }) {
  if (!ownerId) throw new Error('Sign in before saving a private offline find.');
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

  await serializeQueue(async () => {
    const queue = await loadQueue();
    queue.push({ entity, op, id, data, ownerId, queuedAt: Date.now(), ...(op === 'update' && baseUpdatedDate ? { baseUpdatedDate } : {}) });
    await saveQueue(queue);
  });
  if (typeof window !== "undefined") schedulePeriodicRetry();
  return { ok: true, offline: true };
}

export function getQueueLength(ownerId) {
  if (cachedQueue !== null) {
    return ownerId ? cachedQueue.filter(item => item.ownerId === ownerId).length : cachedQueue.length;
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
    const queue = await loadQueue().catch(() => []);
    if (queue.length === 0) {
      clearInterval(retryTimer);
      retryTimer = null;
      return;
    }
    await flushWhenStable().catch(() => {});
  }, PERIODIC_INTERVAL_MS);
}

let installed = false;
export function installOfflineQueue() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  loadQueue().catch((err) => {
    console.warn("offlineQueue: failed to load initial queue", err);
  });

  window.addEventListener("online", () => {
    setTimeout(() => { flushWhenStable().catch(() => {}); }, 1500);
  });

  setTimeout(async () => {
    await flushWhenStable().catch(() => {});
    const queue = await loadQueue().catch(() => []);
    if (queue.length > 0) {
      schedulePeriodicRetry();
    }
  }, 2000);

  window.addEventListener("storage", async (e) => {
    if (e.key === STORAGE_KEY) {
      const queue = await loadQueue().catch(() => []);
      if (queue.length > 0) {
        schedulePeriodicRetry();
      }
    }
  });
}