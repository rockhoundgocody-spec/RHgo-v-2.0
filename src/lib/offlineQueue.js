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
  // Storage full → shed the oldest entries until it fits. Halving guarantees
  // progress; the previous slice(-50) recursed on an identical array whenever
  // the queue was already <= 50 items and silently dropped the write.
  let batch = items;
  while (batch.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(batch));
      return;
    } catch {
      batch = batch.slice(Math.ceil(batch.length / 2));
    }
  }
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* nothing more we can do */ }
}

// A single poisoned write must never block every later find behind it.
const MAX_ATTEMPTS = 5;

let flushing = false;

export async function flushQueue() {
  if (flushing) return { flushed: 0, remaining: loadQueue().length };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { flushed: 0, remaining: loadQueue().length };
  }

  flushing = true;
  let flushed = 0;
  let queueChanged = false;
  let queue = loadQueue();
  try {
    while (queue.length > 0) {
      const next = queue[0];
      try {
        const e = base44.entities[next.entity];
        if (!e) {
          queue.shift();
          queueChanged = true;
          continue;
        }
        if (next.op === 'create') {
          await e.create(next.data);
        } else if (next.op === 'update') {
          await e.update(next.id, next.data);
        }
        flushed += 1;
        queue.shift();
        queueChanged = true;
      } catch (err) {
        // Client errors (4xx) will never succeed on retry — evict so the rest
        // of the queue can drain instead of stalling behind a poison item.
        const status = err?.status ?? err?.response?.status;
        const attempts = (next.attempts || 0) + 1;
        if ((status && status >= 400 && status < 500) || attempts >= MAX_ATTEMPTS) {
          console.warn('offlineQueue: dropping unsendable write', next.entity, next.op, status);
          queue.shift();
          queueChanged = true;
          continue;
        }
        // Transient failure — record the attempt and retry later, order intact.
        queue[0] = { ...next, attempts };
        queueChanged = true;
        break;
      }
    }
    return { flushed, remaining: queue.length };
  } finally {
    if (queueChanged) {
      saveQueue(queue);
    }
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
      // Only queue on network/server errors; propagate client errors (4xx)
      const status = err?.status ?? err?.response?.status;
      if (status && status >= 400 && status < 500) {
        throw err;
      }
      // fall through to queue for network failures
    }
  }

  const queue = loadQueue();
  queue.push({ entity, op, id, data, queuedAt: Date.now() });
  saveQueue(queue);
  // Start background retry loop so this queued item syncs once signal returns
  if (typeof window !== 'undefined') schedulePeriodicRetry();
  return { ok: true, offline: true };
}

export function getQueueLength() {
  return loadQueue().length;
}

/**
 * Probe for a genuine working connection by hitting a tiny public endpoint.
 * Returns true only if we get a real HTTP response.
 */
async function isConnectionStable() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  try {
    const res = await fetch('https://www.gstatic.com/generate_204', {
      method: 'HEAD',
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

/**
 * Flush only after confirming a stable connection via network probe.
 */
export async function flushWhenStable() {
  if (getQueueLength() === 0) return { flushed: 0, remaining: 0 };
  const stable = await isConnectionStable();
  if (!stable) return { flushed: 0, remaining: getQueueLength() };
  return flushQueue();
}

const PERIODIC_INTERVAL_MS = 30_000; // retry every 30 s while queue has items
let retryTimer = null;

function schedulePeriodicRetry() {
  if (retryTimer) return; // already running
  retryTimer = setInterval(async () => {
    if (getQueueLength() === 0) {
      clearInterval(retryTimer);
      retryTimer = null;
      return;
    }
    await flushWhenStable();
  }, PERIODIC_INTERVAL_MS);
}

/**
 * Wire automatic flush on window load + when the browser fires `online`.
 * Uses a connectivity probe to wait for a *stable* connection before flushing.
 * Safe to call multiple times — listeners are idempotent.
 */
let installed = false;
export function installOfflineQueue() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  // Flush when browser reports online — but probe first to confirm stability
  window.addEventListener('online', () => {
    // Short debounce: the `online` event can fire before routes are reachable
    setTimeout(() => { flushWhenStable(); }, 1500);
  });

  // Flush on app boot for any stale items from a previous session
  setTimeout(() => {
    flushWhenStable();
    // If items remain after boot flush, start periodic retry
    schedulePeriodicRetry();
  }, 2000);

  // Also start periodic retry whenever a new item is queued (via storage event)
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && getQueueLength() > 0) {
      schedulePeriodicRetry();
    }
  });
}