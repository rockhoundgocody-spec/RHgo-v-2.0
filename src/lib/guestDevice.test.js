// @vitest-environment jsdom
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
    expect(q.resetsAt).toBe(GUEST_WINDOW_MS);
  });

  it('allows seven completed scans and blocks the eighth', () => {
    for (let i = 1; i <= 7; i++) {
      const after = consumeGuestScan(1000 + i);
      expect(after.used).toBe(i);
      expect(after.allowed).toBe(i < 7);
      expect(after.resetsAt).toBe(GUEST_WINDOW_MS);
    }
    expect(consumeGuestScan(2000).used).toBe(7);
  });

  it('resets at midnight UTC, not 24 hours after the first scan', () => {
    for (let i = 0; i < 7; i++) consumeGuestScan(GUEST_WINDOW_MS - 1000);
    expect(getGuestQuota(GUEST_WINDOW_MS - 1).allowed).toBe(false);
    expect(getGuestQuota(GUEST_WINDOW_MS)).toMatchObject({ allowed: true, used: 0, limit: 7 });
  });

  it('migrates a legacy single-scan record without a month-long block', () => {
    localStorage.setItem(GUEST_QUOTA_KEY, JSON.stringify({ usedAt: 1000 }));
    expect(getGuestQuota(2000)).toMatchObject({ allowed: true, used: 1, limit: 7 });
    expect(getGuestQuota(GUEST_WINDOW_MS)).toMatchObject({ allowed: true, used: 0 });
  });

  it('stashes and hands the report to a later login', () => {
    stashPendingGuestReport({ top_match: 'Quartz', confidence: 0.8 });
    expect(peekPendingGuestReport().report.top_match).toBe('Quartz');
    const taken = takePendingGuestReport();
    expect(taken.report.top_match).toBe('Quartz');
    expect(peekPendingGuestReport()).toBeNull();
    expect(localStorage.getItem(GUEST_PENDING_KEY)).toBeNull();
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