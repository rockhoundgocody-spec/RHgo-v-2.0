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
import { base44 } from '../api/base44Client.js';
import { ensureFreeSubscription } from '../api/coreLoop.js';

// Simple, synchronous DJB2 hash helper to obfuscate email in session storage key
export function hashEmail(email) {
  if (!email) return '';
  let hash = 5381;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 33) ^ email.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

const CACHE_TTL_MS = 10 * 60 * 1000; // re-check tier every 10 min so cancellations propagate

export function useSubscription(user) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user?.email) { setLoading(false); return; }
    let cancelled = false;
    const cacheKey = `sub_${hashEmail(user.email)}`;

    async function load() {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?._cachedAt && Date.now() - parsed._cachedAt < CACHE_TTL_MS) {
            setSubscription(parsed);
            setLoading(false);
            return;
          }
          sessionStorage.removeItem(cacheKey);
        }
        const sub = await ensureFreeSubscription(base44.entities.Subscription, user.email);
        if (!cancelled) {
          setSubscription(sub);
          sessionStorage.setItem(cacheKey, JSON.stringify({ ...sub, _cachedAt: Date.now() }));
        }
      } catch {
        if (!cancelled) setSubscription({ tier: 'free', status: 'active', owner_email: user.email });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user?.email, reloadKey]);

  const isPro = subscription?.tier === 'field_pro' && subscription?.status === 'active';
  const isFamily = subscription?.tier === 'family' && subscription?.status === 'active';
  const isPaid = isPro || isFamily;

  // Call after Stripe webhook confirms payment to refresh locally.
  // Bumping reloadKey re-runs the effect — previously this cleared state but
  // never re-fetched, leaving the hook stuck in loading forever.
  const refresh = () => {
    if (user?.email) {
      const cacheKey = `sub_${hashEmail(user.email)}`;
      sessionStorage.removeItem(cacheKey);
    }
    setLoading(true);
    setSubscription(null);
    setReloadKey((k) => k + 1);
  };

  return { subscription, loading, isPro, isFamily, isPaid, refresh };
}
