import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * useCompanion — fetches and exposes the user's Amethyst companion state.
 * Lightweight: just GETs from getCompanionState on mount, exposes a refresh.
 */
export default function useCompanion() {
  const [companion, setCompanion] = useState(null);
  const [todaysSpecimenCount, setTodaysSpecimenCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await base44.functions.invoke('getCompanionState', {});
        setCompanion(res?.data?.companion || null);
        setTodaysSpecimenCount(res?.data?.todays_specimens || 0);
        setLoading(false);
        return;
      } catch {
        if (attempt === maxRetries) {
          setCompanion(null);
          setLoading(false);
          return;
        }
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { companion, todaysSpecimenCount, loading, refresh };
}