import { afterEach, expect, it, vi } from 'npm:vitest@3.2.4';
import { checkMemberScanQuota } from './scanQuota.ts';
import { enforceGuestRate } from './guestRateLimit.ts';

function client() {
  const rows = [];
  const api = {
    filter: async (query) => rows.filter(row => Object.entries(query).every(([key, value]) => key === 'created_date'
      ? row[key] >= value.$gte && row[key] < value.$lt : row[key] === value)),
    create: async (data) => { const row = { ...data, created_date: new Date().toISOString() }; rows.push(row); return row; },
  };
  return { rows, asServiceRole: { entities: { ScanReceipt: api, CompanionLog: api, Subscription: { filter: async () => [] } } } };
}
afterEach(() => vi.useRealTimers());
it('allows seven member scans, rejects the eighth, resets tomorrow, isolates users', async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-12-31T23:59:00Z'));
  const db = client();
  for (let i = 0; i < 7; i++) {
    expect(await checkMemberScanQuota(db, { email: 'member@example.test' })).toMatchObject({ ok: true, used: i, limit: 7 });
    await db.asServiceRole.entities.ScanReceipt.create({ owner_email: 'member@example.test' });
  }
  expect(await checkMemberScanQuota(db, { email: 'member@example.test' })).toMatchObject({ ok: false, used: 7, resetAt: '2027-01-01T00:00:00.000Z' });
  expect(await checkMemberScanQuota(db, { email: 'other@example.test' })).toMatchObject({ ok: true, used: 0 });
  expect(await checkMemberScanQuota(db, { email: 'member@example.test', role: 'admin' })).toMatchObject({ ok: true, paid: true });
  db.asServiceRole.entities.Subscription.filter = async () => [{ tier: 'field_pro', status: 'active' }];
  expect(await checkMemberScanQuota(db, { email: 'member@example.test' })).toMatchObject({ ok: true, paid: true });
  db.asServiceRole.entities.Subscription.filter = async () => [];
  vi.setSystemTime(new Date('2027-01-01T00:00:00Z'));
  expect(await checkMemberScanQuota(db, { email: 'member@example.test' })).toMatchObject({ ok: true, used: 0 });
});
it('counts durable guest scans, checks without consuming, and resets at midnight', async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-12-31T23:59:00Z'));
  const db = client(); const id = 'g_daily_test_guest';
  for (let i = 0; i < 7; i++) expect(await enforceGuestRate(db, id, 'identify')).toMatchObject({ ok: true, remaining: 6 - i, limit: 7 });
  expect(await enforceGuestRate(db, id, 'identify')).toMatchObject({ ok: false, status: 429 });
  expect(db.rows).toHaveLength(7);
  vi.setSystemTime(new Date('2027-01-01T00:00:00Z'));
  expect(await enforceGuestRate(db, id, 'identify', { consume: false })).toMatchObject({ ok: true, remaining: 7 });
  expect(db.rows).toHaveLength(7);
  expect(await enforceGuestRate(db, id, 'identify')).toMatchObject({ ok: true, remaining: 6 });
});
it('also resets the guest memory fallback at midnight UTC', async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-12-31T23:59:00Z'));
  const id = 'g_memory_daily_test';
  for (let i = 0; i < 7; i++) expect((await enforceGuestRate(null, id, 'identify')).ok).toBe(true);
  expect((await enforceGuestRate(null, id, 'identify')).ok).toBe(false);
  vi.setSystemTime(new Date('2027-01-01T00:00:00Z'));
  expect(await enforceGuestRate(null, id, 'identify')).toMatchObject({ ok: true, remaining: 6 });
});