import { useEffect, useState, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const XP_MILESTONES = [100, 250, 500, 1000, 2500, 5000, 10000];

/**
 * useCompanion — fetches and exposes the user's Amethyst companion state.
 * Detects level-ups and XP milestones, fires onMilestone({ type, label, level?, xp? }).
 */
export default function useCompanion({ onMilestone } = {}) {
  const [companion, setCompanion] = useState(null);
  const [todaysSpecimenCount, setTodaysSpecimenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const prevRef = useRef(null);
  // Store onMilestone in a ref so it never causes refresh to re-create
  const onMilestoneRef = useRef(onMilestone);
  useEffect(() => { onMilestoneRef.current = onMilestone; }, [onMilestone]);

  const refresh = useCallback(async () => {
    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await base44.functions.invoke('getCompanionState', {});
        const next = res?.data?.companion || null;

        if (next && prevRef.current && onMilestoneRef.current) {
          const prev = prevRef.current;
          if (next.level > prev.level) {
            onMilestoneRef.current({ type: 'levelup', level: next.level, label: `Reached Level ${next.level}!` });
          } else {
            const prevXP = prev.xp ?? 0;
            const nextXP = next.xp ?? 0;
            const crossed = XP_MILESTONES.find((m) => prevXP < m && nextXP >= m);
            if (crossed) {
              onMilestoneRef.current({ type: 'milestone', xp: crossed, label: `${crossed} Total XP Reached!` });
            }
          }
        }

        prevRef.current = next;
        setCompanion(next);
        setTodaysSpecimenCount(res?.data?.todays_specimens || 0);
        setLoading(false);
        return;
      } catch {
        if (attempt === maxRetries) {
          setCompanion(null);
          setLoading(false);
          return;
        }
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }, []); // no deps — stable forever, uses refs for callbacks

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { companion, todaysSpecimenCount, loading, refresh };
}