/**
 * useSubscription — loads and caches the signed-in user's subscription tier.
 * Used across the app to gate paid features.
 *
 * Tier values: 'free' | 'field_pro' | 'family'
 *
 * Cross-domain note:
 *   Both rhgo.base44.app and rhgo2.base44.app MUST point to the same Base44
 *   app backend (same app ID / same database) to share subscription records.
 *   Do NOT create a separate Base44 app for rhgo2 — use the same project and
 *   publish it under a custom domain. Doing otherwise creates split user
 *   identities and separate subscription tables.
 */

import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useSubscription(user) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      try {
        const cached = sessionStorage.getItem(`sub_${user.email}`);
        if (cached) {
          setSubscription(JSON.parse(cached));
          setLoading(false);
          return;
        }
        const rows = await base44.entities.Subscription.filter({ owner_email: user.email });
        const sub = rows?.[0] || { tier: 'free', status: 'active', owner_email: user.email };
        if (!cancelled) {
          setSubscription(sub);
          sessionStorage.setItem(`sub_${user.email}`, JSON.stringify(sub));
        }
      } catch {
        if (!cancelled) setSubscription({ tier: 'free', status: 'active' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user?.email]);

  const isPro = subscription?.tier === 'field_pro' && subscription?.status === 'active';
  const isFamily = subscription?.tier === 'family' && subscription?.status === 'active';
  const isPaid = isPro || isFamily;

  // Call after Stripe webhook confirms payment to refresh locally
  const refresh = () => {
    if (user?.email) sessionStorage.removeItem(`sub_${user.email}`);
    setLoading(true);
    setSubscription(null);
  };

  return { subscription, loading, isPro, isFamily, isPaid, refresh };
}