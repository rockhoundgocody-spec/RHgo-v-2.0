import React, { createContext, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useBadgeAwarder } from './useBadgeAwarder';

/**
 * Single source of truth for Geo-Badge evaluation, mounted once in Layout.
 * Running the awarder here (instead of per-page) prevents duplicate badge
 * creation when multiple pages would otherwise each call useBadgeAwarder().
 *
 * Also re-evaluates whenever a Specimen changes, so a freshly scanned find
 * can unlock a badge and trigger the pop-up live — not just on next load.
 */
const BadgeAwarderContext = createContext(null);

export function BadgeAwarderProvider({ children }) {
  const awarder = useBadgeAwarder();
  const { refresh } = awarder;

  useEffect(() => {
    const unsubscribe = base44.entities.Specimen.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update' || event.type === 'delete') {
        refresh();
      }
    });
    return unsubscribe;
  }, [refresh]);

  return (
    <BadgeAwarderContext.Provider value={awarder}>
      {children}
    </BadgeAwarderContext.Provider>
  );
}

export function useBadgeAwarderContext() {
  return useContext(BadgeAwarderContext);
}