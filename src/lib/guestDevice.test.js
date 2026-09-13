import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GUEST_COOKIE,
  GUEST_ID_KEY,
  GUEST_PENDING_KEY,
  GUEST_QUOTA_KEY,
  GUEST_WINDOW_MS,
  consumeGuestScan,
  getGuestQuota,
  getOrCreateGuestId,
  guestLoginUrl,
  hydrateGuestStorage,
  peekPendingGuestReport,
  persistGuestStorage,
  stashPendingGuestReport,
  takePendingGuestReport,
} from './guestDevice';

function clearCookie() {
  document.cookie = `${GUEST_COOKIE}=; Path=/; Max-Age=0`;
}

describe('guestDevice', () => {
  beforeEach(() => {
    // This suite runs in Node. Model only the storage/cookie interfaces under test;
    // no DOM or browser engine is needed for these device-key unit tests.
    const values = new Map();
    const cookies = new Map();
    const local = {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: key => values.delete(key),
      clear: () => values.clear(),
    };
    const doc = {
      get cookie() { return [...cookies].map(([key, value]) => `${key}=${value}`).join('; '); },
      set cookie(value) {
        const pair = value.split(';')[0];
        const split = pair.indexOf('=');
        const key = pair.slice(0, split);
        if (/Max-Age=0(?:;|$)/i.test(value)) cookies.delete(key);
        else cookies.set(key, pair.slice(split + 1));
      },
    };
    vi.stubGlobal('localStorage', local);
    vi.stubGlobal('document', doc);
    vi.stubGlobal('window', { localStorage: local, location: { protocol: 'https:' } });
    vi.stubGlobal('navigator', {});
    clearCookie();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a stable g_ device key', () => {
    const a = getOrCreateGuestId();
    const b = getOrCreateGuestId();
    expect(a).toMatch(/^g_/);
    expect(a).toBe(b);
    expect(localStorage.getItem(GUEST_ID_KEY)).toBe(a);
  });

  it('mirrors the key into a first-party cookie', () => {
    const id = getOrCreateGuestId();
    expect(document.cookie).toContain(GUEST_COOKIE);
    expect(document.cookie).toContain(id);
  });

  it('restores the key from the cookie when localStorage is empty', () => {
    const id = getOrCreateGuestId();
    localStorage.clear();
    expect(localStorage.getItem(GUEST_ID_KEY)).toBeNull();
    expect(getOrCreateGuestId()).toBe(id);
    expect(localStorage.getItem(GUEST_ID_KEY)).toBe(id);
  });

  it('allows the first scan', () => {
    const q = getGuestQuota(1_000);
    expect(q.allowed).toBe(true);
    expect(q.used).toBe(0);
    expect(q.resetsAt).toBeNull();
  });

  it('consumes only after a completed scan and blocks the next', () => {
    const after = consumeGuestScan(1_000);
    expect(after.allowed).toBe(false);
    expect(after.used).toBe(1);
    expect(after.resetsAt).toBe(1_000 + GUEST_WINDOW_MS);
    expect(consumeGuestScan(1_001).allowed).toBe(false);
  });

  it('resets after 30 days', () => {
    consumeGuestScan(1_000);
    const later = getGuestQuota(1_000 + GUEST_WINDOW_MS);
    expect(later.allowed).toBe(true);
    expect(later.used).toBe(0);
  });

  it('stashes and hands the report to a later login', () => {
    stashPendingGuestReport({ top_match: 'Quartz', confidence: 0.8 });
    expect(peekPendingGuestReport().report.top_match).toBe('Quartz');
    const taken = takePendingGuestReport();
    expect(taken.report.top_match).toBe('Quartz');
    expect(peekPendingGuestReport()).toBeNull();
    expect(localStorage.getItem(GUEST_PENDING_KEY)).toBeNull();
  });

  it('builds a login return URL that keeps /scan', () => {
    expect(guestLoginUrl('/scan')).toBe('/login?from_url=%2Fscan');
  });

  it('ignores a corrupt quota blob', () => {
    localStorage.setItem(GUEST_QUOTA_KEY, '{not-json');
    expect(getGuestQuota(5).allowed).toBe(true);
  });

  it('persistGuestStorage asks the browser to keep the origin', async () => {
    const persist = vi.fn().mockResolvedValue(true);
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { persist },
    });
    const id = getOrCreateGuestId();
    const result = await persistGuestStorage();
    expect(result.guestId).toBe(id);
    expect(result.persisted).toBe(true);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('hydrateGuestStorage is an alias that does not throw without IDB', async () => {
    await expect(hydrateGuestStorage()).resolves.toMatchObject({ guestId: expect.stringMatching(/^g_/) });
  });
});