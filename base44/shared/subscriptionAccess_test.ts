import { assertEquals } from 'jsr:@std/assert@1';
import { isPaidSubscription, monthKey, nextMonthStartIso } from './subscriptionAccess.ts';
import { checkMemberScanQuota, findTrustedReceipt } from './scanQuota.ts';

const NOW = Date.parse('2026-09-26T12:00:00Z');

Deno.test('paid tiers in billable states grant access', () => {
  assertEquals(isPaidSubscription({ tier: 'field_pro', status: 'active' }, NOW), true);
  assertEquals(isPaidSubscription({ tier: 'family', status: 'trialing' }, NOW), true);
  assertEquals(isPaidSubscription({ tier: 'field_pro', status: 'past_due' }, NOW), true);
});

Deno.test('free tier, cancelled and unknown states do not', () => {
  assertEquals(isPaidSubscription(null, NOW), false);
  assertEquals(isPaidSubscription({ tier: 'free', status: 'active' }, NOW), false);
  assertEquals(isPaidSubscription({ tier: 'field_pro', status: 'cancelled' }, NOW), false);
  assertEquals(isPaidSubscription({ tier: 'field_pro', status: 'incomplete' }, NOW), false);
});

Deno.test('lapsed period end expires access, with grace only for renewing subscriptions', () => {
  const twoDaysAgo = new Date(NOW - 2 * 86400000).toISOString();
  const tenDaysAgo = new Date(NOW - 10 * 86400000).toISOString();
  assertEquals(isPaidSubscription({ tier: 'field_pro', status: 'active', current_period_end: twoDaysAgo, stripe_subscription_id: 'sub_1' }, NOW), true);
  assertEquals(isPaidSubscription({ tier: 'field_pro', status: 'active', current_period_end: tenDaysAgo, stripe_subscription_id: 'sub_1' }, NOW), false);
  // One-time pass: no subscription id, no grace.
  assertEquals(isPaidSubscription({ tier: 'field_pro', status: 'active', current_period_end: twoDaysAgo }, NOW), false);
});

Deno.test('month helpers', () => {
  const d = new Date('2026-12-31T23:30:00Z');
  assertEquals(monthKey(d), '2026-12');
  assertEquals(nextMonthStartIso(d), '2027-01-01T00:00:00.000Z');
});

function fakeClient(subs: Record<string, unknown>[], receipts: Record<string, unknown>[]) {
  const make = (rows: Record<string, unknown>[]) => ({
    filter: (q: Record<string, unknown>) =>
      Promise.resolve(rows.filter((r) => Object.entries(q).every(([k, v]) => {
        if (k === 'created_date' && typeof v === 'object' && v) {
          const range = v as { $gte: string; $lt: string };
          return String(r[k]) >= range.$gte && String(r[k]) < range.$lt;
        }
        return r[k] === v;
      }))),
    create: (d: Record<string, unknown>) => { rows.push(d); return Promise.resolve(d); },
  });
  return { asServiceRole: { entities: { Subscription: make(subs), ScanReceipt: make(receipts) } } };
}

Deno.test('free member is metered per UTC day; paid and admin are not', async () => {
  const now = new Date(NOW);
  const receipts = Array.from({ length: 7 }, () => ({ owner_email: 'a@x.com', created_date: '2026-09-26T10:00:00.000Z' }));
  const blocked = await checkMemberScanQuota(fakeClient([], receipts) as never, { email: 'a@x.com' }, now);
  assertEquals(blocked.ok, false);
  assertEquals(blocked.used, 7);
  const tomorrow = await checkMemberScanQuota(fakeClient([], receipts) as never, { email: 'a@x.com' }, new Date('2026-09-27T00:00:00Z'));
  assertEquals(tomorrow.used, 0);
  assertEquals(tomorrow.ok, true);

  const fresh = await checkMemberScanQuota(fakeClient([], []) as never, { email: 'a@x.com' }, now);
  assertEquals(fresh.ok, true);
  assertEquals(fresh.used, 0);

  const paid = await checkMemberScanQuota(
    fakeClient([{ owner_email: 'a@x.com', tier: 'field_pro', status: 'active' }], receipts) as never,
    { email: 'a@x.com' }, now,
  );
  assertEquals(paid.ok, true);
  assertEquals(paid.paid, true);

  const admin = await checkMemberScanQuota(fakeClient([], receipts) as never, { email: 'a@x.com', role: 'admin' }, now);
  assertEquals(admin.ok, true);
});

Deno.test('trusted receipt matches by image first, then mineral name, within 24h', async () => {
  const now = new Date(NOW);
  const recent = new Date(NOW - 3600000).toISOString();
  const stale = new Date(NOW - 3 * 86400000).toISOString();
  const client = fakeClient([], [
    { owner_email: 'a@x.com', image_url: 'https://img/1.jpg', top_match: 'Quartz', rarity: 'common', created_date: recent },
    { owner_email: 'a@x.com', image_url: 'https://img/2.jpg', top_match: 'Fire Agate', rarity: 'rare', created_date: recent },
    { owner_email: 'a@x.com', image_url: 'https://img/3.jpg', top_match: 'Benitoite', rarity: 'legendary', created_date: stale },
  ]);
  assertEquals((await findTrustedReceipt(client as never, 'a@x.com', 'https://img/2.jpg', 'Quartz', now))?.rarity, 'rare');
  assertEquals((await findTrustedReceipt(client as never, 'a@x.com', 'https://cutout/x.png', 'fire agate', now))?.rarity, 'rare');
  assertEquals(await findTrustedReceipt(client as never, 'a@x.com', 'https://img/3.jpg', 'Benitoite', now), null);
});