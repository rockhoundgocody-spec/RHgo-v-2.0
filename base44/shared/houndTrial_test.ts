import { assertEquals } from 'jsr:@std/assert@1';
import { houndTrialStatus } from './houndTrial.ts';
import { isPaidSubscription } from './subscriptionAccess.ts';
const now = Date.parse('2026-10-09T12:00:00Z');
const scan = { created_date: '2026-10-08T12:00:00.000000' };
const end = '2026-10-22T12:00:00.000Z';
Deno.test('requires a server scan and fixes expiry to the first scan', () => {
  assertEquals(houndTrialStatus([], null, now).state, 'needs_scan');
  assertEquals(houndTrialStatus([], scan, now), { state: 'eligible', eligible: true, ends_at: end });
  assertEquals(houndTrialStatus([], scan, now + 86400000).ends_at, end);
  assertEquals(houndTrialStatus([], scan, Date.parse(end)).state, 'expired');
  assertEquals(houndTrialStatus([], { created_date: 'invalid' }, now).eligible, false);
});
Deno.test('never overwrites paid access or renews an expired trial', () => {
  assertEquals(houndTrialStatus([{ tier: 'family', status: 'active' }], scan, now).state, 'member');
  assertEquals(houndTrialStatus([{ tier: 'field_pro', status: 'cancelled', stripe_subscription_id: 'sub_old' }], scan, now).state, 'unavailable');
  const trial = { tier: 'field_pro', status: 'trialing', plan: 'hound_trial', trial_end: end, current_period_end: end };
  assertEquals(houndTrialStatus([trial], scan, now).state, 'active');
  assertEquals(houndTrialStatus([trial], scan, Date.parse(end)).state, 'expired');
  assertEquals(isPaidSubscription(trial, Date.parse(end)), false);
  assertEquals(isPaidSubscription({ ...trial, stripe_subscription_id: 'sub_example' }, Date.parse(end)), false);
});