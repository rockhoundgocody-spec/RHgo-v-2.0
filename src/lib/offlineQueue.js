/**
 * offlineQueue — durable write buffer for the field.
 *
 * When the rockhound is in a canyon with no signal, entity writes (creating a
 * Specimen, logging a verification test, etc.) are buffered to localStorage
 * and flushed automatically when the network returns.
 *
 * This is intentionally tiny and stateless — every consumer just calls
 * `queueWrite(...)` instead of base44.entities.X.create(...) directly. The
 * queue handles retry, ordering, and reconnect.
 */
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'rh-offline-queue-v1';

function loadQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage full — drop oldest
    if (items.length > 1) saveQueue(items.slice(-50));
  }
}

let flushing = false;

export async function flushQueue() {
  if (flushing) return { flushed: 0, remaining: loadQueue().length };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { flushed: 0, remaining: loadQueue().length };
  }

  flushing = true;
  let flushed = 0;
  try {
    let queue = loadQueue();
    while (queue.length > 0) {
      const next = queue[0];
      try {
        const e = base44.entities[next.entity];
        if (!e) { queue.shift(); continue; }
        if (next.op === 'create') {
          await e.create(next.data);
        } else if (next.op === 'update') {
          await e.update(next.id, next.data);
        }
        flushed += 1;
        queue.shift();
        saveQueue(queue);
      } catch {
        // Stop on first failure — preserves order, retry later.
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
export async function queueWrite({ entity, op = 'create', id, data }) {
  const online = typeof navigator === 'undefined' || navigator.onLine !== false;

  if (online) {
    try {
      const e = base44.entities[entity];
      const result = op === 'create' ? await e.create(data) : await e.update(id, data);
      return { ok: true, offline: false, result };
    } catch (err) {
      // fall through to queue
    }
  }

  const queue = loadQueue();
  queue.push({ entity, op, id, data, queuedAt: Date.now() });
  saveQueue(queue);
  return { ok: true, offline: true };
}

export function getQueueLength() {
  return loadQueue().length;
}

/**
 * Wire automatic flush on window load + when the browser fires `online`.
 * Safe to call multiple times — listeners are idempotent.
 */
let installed = false;
export function installOfflineQueue() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('online', () => { flushQueue(); });
  // also flush on app boot in case we have stale items
  setTimeout(() => { flushQueue(); }, 1500);
}