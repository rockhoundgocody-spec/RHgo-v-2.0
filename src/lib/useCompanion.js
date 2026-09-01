import { useEffect, useState, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const XP_MILESTONES = [100, 250, 500, 1000, 2500, 5000, 10000];
const COMPANION_CACHE_KEY = 'rhgo_clover_state';

/**
 * useCompanion — fetches and exposes the user's Amethyst companion state.
 * Detects level-ups and XP milestones, fires onMilestone({ type, label, level?, xp? }).
 *
 * State is cached to localStorage so the orb's evolved personality + growth
 * loads instantly on every app open — even offline — then syncs with the
 * backend when the network is available.
 */
export default function useCompanion({ onMilestone } = {}) {
  const [companion, setCompanion] = useState(() => {
    try {
      const cached = localStorage.getItem(COMPANION_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [todaysSpecimenCount, setTodaysSpecimenCount] = useState(0);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(() => {
    try { return !localStorage.getItem(COMPANION_CACHE_KEY); } catch { return true; }
  });
  const prevRef = useRef(null);
  // Store onMilestone in a ref so it never causes refresh to re-create
  const onMilestoneRef = useRef(onMilestone);
  useEffect(() => { onMilestoneRef.current = onMilestone; }, [onMilestone]);

  // Seed prevRef from cached state so growth since last session is detected
  // on the first backend sync (e.g. leveled up between opens).
  useEffect(() => {
    if (prevRef.current === null) {
      try {
        const cached = localStorage.getItem(COMPANION_CACHE_KEY);
        if (cached) prevRef.current = JSON.parse(cached);
      } catch {}
    }
  }, []);

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
        setOffline(false);
        setLoading(false);
        // Persist to device so the orb's evolved state loads instantly next open
        if (next) {
          try { localStorage.setItem(COMPANION_CACHE_KEY, JSON.stringify(next)); } catch {}
        }
        return;
      } catch {
        if (attempt === maxRetries) {
          // Keep the cached companion if we have one — don't blank the orb
          // just because the network is down. Mark as offline so the UI can
          // show a subtle "last known state" indicator.
          try {
            const cached = localStorage.getItem(COMPANION_CACHE_KEY);
            if (cached) setCompanion(JSON.parse(cached));
          } catch {}
          setOffline(true);
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

  return { companion, todaysSpecimenCount, loading, offline, refresh };
}