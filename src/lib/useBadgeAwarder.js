import { useEffect, useRef, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { BADGES, evaluateEarnedCodes, getBadgeDefinition, computeBadgeMetrics } from './badgeDefinitions';

/**
 * Evaluates the user's specimens (+ community/quest/profile context) against the
 * Geo-Badge catalog, persists newly-earned badges, and queues them for unlock.
 *
 * Returns:
 *   - earnedCodes:    Set of codes the user owns
 *   - earnedRecords:  { [code]: BadgeRecord } (includes earned_at for date sorting)
 *   - specimens:      raw specimen list
 *   - badgeMetrics:   precomputed metrics (with context) for progress bars
 *   - pendingBadge:   badge def to show in the unlock overlay (or null)
 *   - dismissPending(): clears the current pending badge
 *   - refresh():      re-runs evaluation
 */
export function useBadgeAwarder() {
  const [earnedCodes, setEarnedCodes] = useState(new Set());
  const [earnedRecords, setEarnedRecords] = useState({});
  const [specimens, setSpecimens] = useState([]);
  const [badgeMetrics, setBadgeMetrics] = useState({});
  const [queue, setQueue] = useState([]);
  const evaluatingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (evaluatingRef.current) return;
    evaluatingRef.current = true;
    try {
      const me = await base44.auth.me();
      if (!me?.email) return;

      // Performance optimization: pass fields projection array to base44.entities.Specimen.list()
      // to exclude heavy attributes (e.g. high-res image_url payloads) and load only attributes needed for badge evaluation.
      const [fetchedSpecimens, ownedRecords, posts, profileRecords, questRecords] = await Promise.all([
        base44.entities.Specimen.list('-created_date', 1000, 0, [
          'id', 'mineral_name', 'found_at', 'rarity', 'verified', 'ai_confidence', 'notes', 'found_date', 'created_date'
        ]),
        base44.entities.Badge.filter({ owner_email: me.email }),
        base44.entities.Post.list('-created_date', 200).catch(() => []),
        base44.entities.PlayerProfile.filter({ owner_email: me.email }).catch(() => []),
        base44.entities.Quest.filter({ owner_email: me.email }).catch(() => []),
      ]);
      const nextSpecimens = fetchedSpecimens || [];
      setSpecimens(nextSpecimens);

      const playerProfile = (profileRecords || [])[0] || null;
      const context = { posts: posts || [], playerProfile, quests: questRecords || [], ownerEmail: me.email };
      const metrics = computeBadgeMetrics(nextSpecimens, context);
      setBadgeMetrics(metrics);

      const recordsByCode = {};
      (ownedRecords || []).forEach((r) => { recordsByCode[r.code] = r; });
      const ownedCodes = new Set(Object.keys(recordsByCode));
      // Performance Optimization: Pass precomputed metrics object calculated from nextSpecimens to avoid redundant duplicate computeBadgeMetrics calculation
      const qualifiedCodes = evaluateEarnedCodes(metrics, context);
      const newCodes = qualifiedCodes.filter((c) => !ownedCodes.has(c));

      if (newCodes.length) {
        const now = new Date().toISOString();
        await base44.entities.Badge.bulkCreate(
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
        newCodes.forEach((c) => {
          ownedCodes.add(c);
          recordsByCode[c] = { code: c, earned_at: now };
        });
      }
      setEarnedCodes(ownedCodes);
      setEarnedRecords(recordsByCode);
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

  return { earnedCodes, earnedRecords, specimens, badgeMetrics, pendingBadge, dismissPending, refresh, allBadges: BADGES };
}