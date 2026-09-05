import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  GUEST_ID_KEY,
  GUEST_PENDING_KEY,
  GUEST_QUOTA_KEY,
  GUEST_WINDOW_MS,
  consumeGuestScan,
  getGuestQuota,
  getOrCreateGuestId,
  guestLoginUrl,
  peekPendingGuestReport,
  stashPendingGuestReport,
  takePendingGuestReport,
} from './guestDevice';

describe('guestDevice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('creates a stable g_ device key', () => {
    const a = getOrCreateGuestId();
    const b = getOrCreateGuestId();
    expect(a).toMatch(/^g_/);
    expect(a).toBe(b);
    expect(localStorage.getItem(GUEST_ID_KEY)).toBe(a);
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
});
