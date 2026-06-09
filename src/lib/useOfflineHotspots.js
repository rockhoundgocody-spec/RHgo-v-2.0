import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { saveCache, loadCache } from '@/lib/offlineCache';

/**
 * Hotspot loader with offline fallback.
 *
 * Behavior:
 *  1. Hydrate immediately from IndexedDB cache (instant render in the field).
 *  2. Try a network fetch — if it succeeds, replace data and refresh cache.
 *  3. If network fails (offline / no signal), keep cached data and surface
 *     `isOffline=true` + `cachedAt` so the UI can show a banner.
 */
const CACHE_KEY = 'Hotspot';

export default function useOfflineHotspots() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [cachedAt, setCachedAt] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const cached = await loadCache(CACHE_KEY);
    if (cached?.data) {
      setData(cached.data);
      setCachedAt(cached.updatedAt);
      setIsLoading(false);
    }
    try {
      const fresh = await base44.entities.Hotspot.list();
      setData(fresh);
      setIsOffline(false);
      setCachedAt(Date.now());
      setError(null);
      saveCache(CACHE_KEY, fresh);
    } catch (err) {
      setIsOffline(true);
      if (!cached?.data) setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Also refetch when page becomes visible (tab/app switch)
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchData();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchData]);

  return { data, isLoading, isOffline, cachedAt, error, refetch: fetchData };
}