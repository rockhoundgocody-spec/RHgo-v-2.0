/**
 * Guest device key + scan quota.
 *
 * One completed ID per device per 30 days. Camera permission
 * denies and failed identifies do not consume the scan.
 *
 * Persistence (same-origin only):
 *   1. localStorage   — fast, sync
 *   2. cookie         — survives some LS wipes
 *   3. IndexedDB      — hydrated async, written through
 *   4. storage.persist() after a completed scan (best-effort)
 *
 * Server-side enforcement still belongs on identifySpecimen.
 */

export const GUEST_ID_KEY = 'rhgo_guest_id';
export const GUEST_QUOTA_KEY = 'rhgo_guest_quota';
export const GUEST_PENDING_KEY = 'rhgo_guest_pending_report';
export const GUEST_COOKIE = 'rhgo_gid';
export const GUEST_DB = 'rhgo_guest';
export const GUEST_STORE = 'kv';
export const GUEST_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export const GUEST_SCAN_LIMIT = 1;
export const GUEST_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

function hasWindow() {
  return typeof window !== 'undefined';
}

function storage() {
  try {
    return hasWindow() ? window.localStorage : null;
  } catch {
    return null;
  }
}

function randomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `g_${crypto.randomUUID()}`;
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `g_${hex}`;
}

function isGuestId(value) {
  return typeof value === 'string' && value.startsWith('g_') && value.length > 3;
}

function readCookie(name) {
  if (!hasWindow() || typeof document === 'undefined') return null;
  try {
    const parts = document.cookie ? document.cookie.split(';') : [];
    for (const part of parts) {
      const [rawKey, ...rest] = part.trim().split('=');
      if (rawKey === name) return decodeURIComponent(rest.join('='));
    }
  } catch {
    return null;
  }
  return null;
}

function writeCookie(name, value) {
  if (!hasWindow() || typeof document === 'undefined') return;
  try {
    const secure = window.location?.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${GUEST_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  } catch {
    /* private mode / cookie blocked */
  }
}

function readLs(key) {
  try {
    return storage()?.getItem(key) || null;
  } catch {
    return null;
  }
}

function writeLs(key, value) {
  try {
    storage()?.setItem(key, value);
  } catch {
    /* quota / private */
  }
}

function removeLs(key) {
  try {
    storage()?.removeItem(key);
  } catch {
    /* ignore */
  }
}

function openDb() {
  if (!hasWindow() || typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    let req;
    try {
      req = indexedDB.open(GUEST_DB, 1);
    } catch {
      resolve(null);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(GUEST_STORE)) db.createObjectStore(GUEST_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

function idbGet(key) {
  return openDb().then((db) => {
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(GUEST_STORE, 'readonly');
        const req = tx.objectStore(GUEST_STORE).get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  });
}

function idbSet(key, value) {
  return openDb().then((db) => {
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(GUEST_STORE, 'readwrite');
        tx.objectStore(GUEST_STORE).put(value, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  });
}

function idbDelete(key) {
  return openDb().then((db) => {
    if (!db) return;
    try {
      db.transaction(GUEST_STORE, 'readwrite').objectStore(GUEST_STORE).delete(key);
    } catch {
      /* ignore */
    }
  });
}

function persistAll(id, quotaJson, pendingJson) {
  if (isGuestId(id)) {
    writeLs(GUEST_ID_KEY, id);
    writeCookie(GUEST_COOKIE, id);
    idbSet(GUEST_ID_KEY, id);
  }
  if (quotaJson != null) {
    writeLs(GUEST_QUOTA_KEY, quotaJson);
    idbSet(GUEST_QUOTA_KEY, quotaJson);
  }
  if (pendingJson != null) {
    writeLs(GUEST_PENDING_KEY, pendingJson);
    idbSet(GUEST_PENDING_KEY, pendingJson);
  }
}

export function getOrCreateGuestId() {
  const fromLs = readLs(GUEST_ID_KEY);
  if (isGuestId(fromLs)) {
    writeCookie(GUEST_COOKIE, fromLs);
    return fromLs;
  }
  const fromCookie = readCookie(GUEST_COOKIE);
  if (isGuestId(fromCookie)) {
    writeLs(GUEST_ID_KEY, fromCookie);
    return fromCookie;
  }
  const id = randomId();
  persistAll(id, null, null);
  return id;
}

function readQuota() {
  const raw = readLs(GUEST_QUOTA_KEY);
  if (!raw) return { usedAt: null };
  try {
    const parsed = JSON.parse(raw);
    const usedAt = Number(parsed?.usedAt);
    return { usedAt: Number.isFinite(usedAt) ? usedAt : null };
  } catch {
    return { usedAt: null };
  }
}

function writeQuota(usedAt) {
  const guestId = getOrCreateGuestId();
  const quotaJson = JSON.stringify({ guestId, usedAt });
  persistAll(guestId, quotaJson, null);
}

export function getGuestQuota(now = Date.now()) {
  const guestId = getOrCreateGuestId();
  const { usedAt } = readQuota();
  if (!usedAt) {
    return { guestId, allowed: true, used: 0, limit: GUEST_SCAN_LIMIT, resetsAt: null };
  }
  const resetsAt = usedAt + GUEST_WINDOW_MS;
  if (now >= resetsAt) {
    return { guestId, allowed: true, used: 0, limit: GUEST_SCAN_LIMIT, resetsAt: null };
  }
  return { guestId, allowed: false, used: 1, limit: GUEST_SCAN_LIMIT, resetsAt };
}

export function consumeGuestScan(now = Date.now()) {
  const current = getGuestQuota(now);
  if (!current.allowed) return current;
  writeQuota(now);
  persistGuestStorage().catch(() => {});
  return getGuestQuota(now);
}

export function stashPendingGuestReport(report) {
  if (!report) return;
  const guestId = getOrCreateGuestId();
  const pendingJson = JSON.stringify({
    guestId,
    stashedAt: Date.now(),
    report,
  });
  persistAll(guestId, null, pendingJson);
}

export function peekPendingGuestReport() {
  const raw = readLs(GUEST_PENDING_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.report ? parsed : null;
  } catch {
    return null;
  }
}

export function takePendingGuestReport() {
  const pending = peekPendingGuestReport();
  removeLs(GUEST_PENDING_KEY);
  idbDelete(GUEST_PENDING_KEY);
  return pending;
}

export function guestLoginUrl(returnPath = '/scan') {
  const path = returnPath.startsWith('/') ? returnPath : `/${returnPath}`;
  return `/login?from_url=${encodeURIComponent(path)}`;
}

export async function persistGuestStorage() {
  const id = getOrCreateGuestId();

  const [idbId, idbQuota, idbPending] = await Promise.all([
    idbGet(GUEST_ID_KEY),
    idbGet(GUEST_QUOTA_KEY),
    idbGet(GUEST_PENDING_KEY),
  ]);

  if (!isGuestId(readLs(GUEST_ID_KEY)) && isGuestId(idbId)) {
    writeLs(GUEST_ID_KEY, idbId);
    writeCookie(GUEST_COOKIE, idbId);
  } else {
    persistAll(id, null, null);
  }

  if (!readLs(GUEST_QUOTA_KEY) && typeof idbQuota === 'string') {
    writeLs(GUEST_QUOTA_KEY, idbQuota);
  }
  if (!readLs(GUEST_PENDING_KEY) && typeof idbPending === 'string') {
    writeLs(GUEST_PENDING_KEY, idbPending);
  }

  let persisted = false;
  try {
    if (hasWindow() && navigator.storage?.persist) {
      persisted = await navigator.storage.persist();
    }
  } catch {
    persisted = false;
  }

  return { guestId: readLs(GUEST_ID_KEY) || id, persisted };
}

export async function hydrateGuestStorage() {
  return persistGuestStorage();
}
