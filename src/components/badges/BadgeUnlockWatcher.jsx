import React from 'react';
import { useBadgeAwarderContext } from '@/lib/BadgeAwarderContext';
import { lazyPart } from '@/lib/lazyPart';

// The celebration (and its badge artwork) loads only when a badge unlocks.
const BadgeUnlockAnimation = lazyPart(() => import('./BadgeUnlockAnimation'));

/**
 * Global Geo-Badge unlock pop-up. Mounted once in Layout so a newly earned
 * badge triggers the cinematic unlock overlay from anywhere in the app —
 * not only while sitting on the Badges page.
 */
export default function BadgeUnlockWatcher() {
  const awarder = useBadgeAwarderContext();
  const pendingBadge = awarder?.pendingBadge;
  const dismissPending = awarder?.dismissPending;
  if (!pendingBadge || !dismissPending) return null;
  return <BadgeUnlockAnimation badge={pendingBadge} onClose={dismissPending} />;
}