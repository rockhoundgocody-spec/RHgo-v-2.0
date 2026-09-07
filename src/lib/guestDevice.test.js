import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

let GUEST_COOKIE,
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
  takePendingGuestReport;

const createStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
};

const localStorageMock = createStorage();

function clearCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = `${GUEST_COOKIE}=; Path=/; Max-Age=0`;
  }
}

beforeAll(async () => {
  if (typeof globalThis.window === 'undefined') {
    let cookieStore = '';
    const mockWin = {
      location: { origin: 'http://localhost' },
      localStorage: localStorageMock,
      navigator: { storage: { persist: vi.fn().mockResolvedValue(true) } },
    };
    mockWin.self = mockWin;
    mockWin.top = mockWin;
    globalThis.window = mockWin;
    globalThis.localStorage = localStorageMock;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: mockWin.navigator,
    });
    globalThis.document = {
      get cookie() {
        return cookieStore;
      },
      set cookie(val) {
        if (val.includes('Max-Age=0')) {
          cookieStore = '';
        } else {
          cookieStore = val;
        }
      },
    };
  }

  const mod = await import('./guestDevice');
  GUEST_COOKIE = mod.GUEST_COOKIE;
  GUEST_ID_KEY = mod.GUEST_ID_KEY;
  GUEST_PENDING_KEY = mod.GUEST_PENDING_KEY;
  GUEST_QUOTA_KEY = mod.GUEST_QUOTA_KEY;
  GUEST_WINDOW_MS = mod.GUEST_WINDOW_MS;
  consumeGuestScan = mod.consumeGuestScan;
  getGuestQuota = mod.getGuestQuota;
  getOrCreateGuestId = mod.getOrCreateGuestId;
  guestLoginUrl = mod.guestLoginUrl;
  hydrateGuestStorage = mod.hydrateGuestStorage;
  peekPendingGuestReport = mod.peekPendingGuestReport;
  persistGuestStorage = mod.persistGuestStorage;
  stashPendingGuestReport = mod.stashPendingGuestReport;
  takePendingGuestReport = mod.takePendingGuestReport;
});

describe('guestDevice', () => {
  beforeEach(() => {
    localStorage.clear();
    clearCookie();
  });

  afterEach(() => {
    localStorage.clear();
    clearCookie();
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
