import { describe, it, expect } from 'vitest';
import { isPaidSubscription } from './subscriptionAccess';

const NOW = Date.parse('2026-09-26T12:00:00Z');

describe('isPaidSubscription', () => {
  it('grants access for paid tiers in billable states', () => {
    expect(isPaidSubscription({ tier: 'field_pro', status: 'active' }, NOW)).toBe(true);
    expect(isPaidSubscription({ tier: 'family', status: 'trialing' }, NOW)).toBe(true);
    expect(isPaidSubscription({ tier: 'field_pro', status: 'past_due' }, NOW)).toBe(true);
  });

  it('denies free, cancelled and unknown states', () => {
    expect(isPaidSubscription(null, NOW)).toBe(false);
    expect(isPaidSubscription({ tier: 'free', status: 'active' }, NOW)).toBe(false);
    expect(isPaidSubscription({ tier: 'field_pro', status: 'cancelled' }, NOW)).toBe(false);
    expect(isPaidSubscription({ tier: 'field_pro', status: 'incomplete' }, NOW)).toBe(false);
  });

  it('expires lapsed access, with renewal grace only for subscriptions', () => {
    const twoDaysAgo = new Date(NOW - 2 * 86400000).toISOString();
    expect(isPaidSubscription({ tier: 'field_pro', status: 'active', current_period_end: twoDaysAgo, stripe_subscription_id: 'sub_1' }, NOW)).toBe(true);
    expect(isPaidSubscription({ tier: 'field_pro', status: 'active', current_period_end: twoDaysAgo }, NOW)).toBe(false);
  });
});
