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
  const [specimens, setSpecimens] = useState([]);
  const [queue, setQueue] = useState([]);
  const evaluatingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (evaluatingRef.current) return;
    evaluatingRef.current = true;
    try {
      const me = await base44.auth.me();
      if (!me?.email) return;

      // ⚡ Bolt Performance Optimization:
      // Use SDK field projection to select only required fields for badge metric evaluation and ownership checks.
      // This dramatically reduces payload size and memory parsing overhead when users have large collections.
      const SPECIMEN_FIELDS = [
        'id',
        'mineral_name',
        'found_at',
        'rarity',
        'verified',
        'ai_confidence',
        'notes',
        'found_date',
        'created_date',
      ];
      const BADGE_FIELDS = ['id', 'code', 'owner_email'];

      const [fetchedSpecimens, ownedRecords] = await Promise.all([
        base44.entities.Specimen.list(null, null, null, SPECIMEN_FIELDS),
        base44.entities.Badge.filter({ owner_email: me.email }, null, null, null, BADGE_FIELDS),
      ]);
      const nextSpecimens = fetchedSpecimens || [];
      setSpecimens(nextSpecimens);

      const ownedCodes = new Set((ownedRecords || []).map((b) => b.code));
      const qualifiedCodes = evaluateEarnedCodes(nextSpecimens);
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

  return { earnedCodes, specimens, pendingBadge, dismissPending, refresh, allBadges: BADGES };
}
