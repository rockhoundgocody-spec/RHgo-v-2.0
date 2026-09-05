/**
 * Guest device key + scan quota.
 *
 * One completed ID per device per 30 days. Camera permission
 * denies and failed identifies do not consume the scan.
 *
 * Storage is local to the browser. Server-side enforcement still
 * belongs on identifySpecimen when that function is public.
 */

export const GUEST_ID_KEY = 'rhgo_guest_id';
export const GUEST_QUOTA_KEY = 'rhgo_guest_quota';
export const GUEST_PENDING_KEY = 'rhgo_guest_pending_report';
export const GUEST_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export const GUEST_SCAN_LIMIT = 1;

function storage() {
  try {
    return window.localStorage;
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

export function getOrCreateGuestId() {
  const store = storage();
  if (!store) return randomId();
  const existing = store.getItem(GUEST_ID_KEY);
  if (existing && existing.startsWith('g_')) return existing;
  const id = randomId();
  store.setItem(GUEST_ID_KEY, id);
  return id;
}

function readQuota() {
  const store = storage();
  if (!store) return { usedAt: null };
  try {
    const raw = store.getItem(GUEST_QUOTA_KEY);
    if (!raw) return { usedAt: null };
    const parsed = JSON.parse(raw);
    const usedAt = Number(parsed?.usedAt);
    return { usedAt: Number.isFinite(usedAt) ? usedAt : null };
  } catch {
    return { usedAt: null };
  }
}

function writeQuota(usedAt) {
  const store = storage();
  if (!store) return;
  store.setItem(
    GUEST_QUOTA_KEY,
    JSON.stringify({
      guestId: getOrCreateGuestId(),
      usedAt,
    }),
  );
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
  return getGuestQuota(now);
}

export function stashPendingGuestReport(report) {
  const store = storage();
  if (!store || !report) return;
  store.setItem(
    GUEST_PENDING_KEY,
    JSON.stringify({
      guestId: getOrCreateGuestId(),
      stashedAt: Date.now(),
      report,
    }),
  );
}

export function peekPendingGuestReport() {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(GUEST_PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.report ? parsed : null;
  } catch {
    return null;
  }
}

export function takePendingGuestReport() {
  const pending = peekPendingGuestReport();
  storage()?.removeItem(GUEST_PENDING_KEY);
  return pending;
}

export function guestLoginUrl(returnPath = '/scan') {
  const path = returnPath.startsWith('/') ? returnPath : `/${returnPath}`;
  return `/login?from_url=${encodeURIComponent(path)}`;
}
