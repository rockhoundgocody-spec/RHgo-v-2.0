import { describe, it, expect } from 'vitest';
import { isPaidSubscription } from './subscriptionAccess.js';
const now = Date.parse('2026-10-09T12:00:00Z');
const end = '2026-10-22T12:00:00.000Z';
describe('Hound trial access', () => {
  const trial = { tier: 'field_pro', status: 'trialing', plan: 'hound_trial', trial_end: end, current_period_end: end };
  it('unlocks an active trial and expires at the exact deadline', () => {
    expect(isPaidSubscription(trial, now)).toBe(true);
    expect(isPaidSubscription(trial, Date.parse(end))).toBe(false);
  });
  it('does not grant renewal grace to trials', () => {
    expect(isPaidSubscription({ ...trial, stripe_subscription_id: 'sub_example' }, Date.parse(end) + 1)).toBe(false);
  });
  it('denies missing or malformed trial expiry', () => {
    expect(isPaidSubscription({ ...trial, trial_end: 'invalid' }, now)).toBe(false);
    expect(isPaidSubscription({ tier: 'field_pro', status: 'trialing', plan: 'hound_trial' }, now)).toBe(false);
  });
});