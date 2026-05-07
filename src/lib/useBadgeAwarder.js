import { useEffect, useRef, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { BADGES, evaluateEarnedCodes, getBadgeDefinition } from './badgeDefinitions';

/**
 * Evaluates the user's specimens against the badge catalog,
 * persists newly-earned badges, and queues them for unlock animation.
 *
 * Returns:
 *   - earnedCodes:  Set of codes the user owns
 *   - pendingBadge: badge def to show in the unlock overlay (or null)
 *   - dismissPending(): clears the current pending badge
 *   - refresh(): re-runs evaluation
 */
export function useBadgeAwarder() {
  const [earnedCodes, setEarnedCodes] = useState(new Set());
  const [queue, setQueue] = useState([]);
  const evaluatingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (evaluatingRef.current) return;
    evaluatingRef.current = true;
    try {
      const me = await base44.auth.me();
      if (!me?.email) return;

      const [specimens, ownedRecords] = await Promise.all([
        base44.entities.Specimen.filter({ created_by: me.email }),
        base44.entities.Badge.filter({ owner_email: me.email }),
      ]);

      const ownedCodes = new Set((ownedRecords || []).map((b) => b.code));
      const qualifiedCodes = evaluateEarnedCodes(specimens || []);
      const newCodes = qualifiedCodes.filter((c) => !ownedCodes.has(c));

      if (newCodes.length) {
        const now = new Date().toISOString();
        const created = await base44.entities.Badge.bulkCreate(
          newCodes.map((code) => {
            const def = getBadgeDefinition(code);
            return {
              code,
              title: def.title,
              description: def.description,
              rarity: def.rarity,
              icon: def.icon,
              earned_at: now,
              owner_email: me.email,
            };
          })
        );
        const newDefs = newCodes.map((c) => getBadgeDefinition(c));
        setQueue((q) => [...q, ...newDefs]);
        newCodes.forEach((c) => ownedCodes.add(c));
      }
      setEarnedCodes(ownedCodes);
    } finally {
      evaluatingRef.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pendingBadge = queue[0] || null;
  const dismissPending = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  return { earnedCodes, pendingBadge, dismissPending, refresh, allBadges: BADGES };
}