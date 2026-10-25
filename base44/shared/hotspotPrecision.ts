/** Hotspot coordinate precision: exact for paid, non-Stealth users; ~1 km (2 decimals) otherwise. */

export function roundCoord(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

export function coarsenHotspot<T extends Record<string, unknown>>(h: T): T {
  return { ...h, lat: roundCoord(h.lat), lng: roundCoord(h.lng), coords_precision: 'approximate' };
}

import { isPaidSubscription } from './subscriptionAccess.ts';

/** Exact coordinates only for admins, or paid users who are not in Stealth Mode. */
// deno-lint-ignore no-explicit-any
export async function canSeeExactHotspots(base44: any, user: any): Promise<boolean> {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (isStealth(user)) return false;
  const subs = await base44.asServiceRole.entities.Subscription.filter({ owner_email: user.email }, '-updated_date', 1);
  return isPaidSubscription(subs?.[0]);
}

/** Stealth Mode = the user's saved privacy level is "private". */
export function isStealth(user: { app_settings?: { privacyLevel?: string } } | null): boolean {
  return user?.app_settings?.privacyLevel === 'private';
}