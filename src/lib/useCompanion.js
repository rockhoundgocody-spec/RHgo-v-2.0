import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * useCompanion — fetches and exposes the user's Amethyst companion state.
 * Lightweight: just GETs from getCompanionState on mount, exposes a refresh.
 */
export default function useCompanion() {
  const [companion, setCompanion] = useState(null);
  const [todaysSpecimens, setTodaysSpecimens] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('getCompanionState', {});
      setCompanion(res?.data?.companion || null);
      setTodaysSpecimens(res?.data?.todays_specimens || 0);
    } catch {
      setCompanion(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { companion, todaysSpecimens, loading, refresh };
}