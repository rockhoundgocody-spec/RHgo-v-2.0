/**
 * Hotspot loader with offline fallback.
 *
 * Strategy:
 *  1. Seed React Query's global cache from IndexedDB immediately (instant render).
 *  2. React Query fetches fresh data — cache persists across navigations so
 *     re-mounting Explore never shows an empty state.
 *  3. On network failure, keep whatever data we have and surface isOffline=true.
 */
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { saveCache, loadCache } from '@/lib/offlineCache';
import { isPublishedHotspot } from '@/lib/locationPolicy';

const CACHE_KEY = 'Hotspot';
const QUERY_KEY = ['hotspots'];
const FETCH_LIMIT = 2000; // fetch all hotspots, not just the default 50

export default function useOfflineHotspots() {
  const queryClient = useQueryClient();
  const [isOffline, setIsOffline] = useState(false);
  const [cachedAt, setCachedAt] = useState(null);

  // On first mount: seed React Query cache from IndexedDB so the map
  // renders immediately even before the network fetch completes.
  useEffect(() => {
    loadCache(CACHE_KEY).then((cached) => {
      if (cached?.data?.length > 0) {
        const safeCached = cached.data.filter(isPublishedHotspot);
        const existing = queryClient.getQueryData(QUERY_KEY);
        if ((!Array.isArray(existing) || existing.length === 0) && safeCached.length > 0) {
          queryClient.setQueryData(QUERY_KEY, safeCached);
          setCachedAt(cached.updatedAt);
        }
      }
    });
  }, [queryClient]);

  const { data: rawData = [], isFetching, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      try {
        const response = await base44.entities.Hotspot.list(undefined, FETCH_LIMIT);
        // Defense in depth for old deployments and stale caches: legacy/hold
        // records are never rendered even if the server returns them.
        const fresh = response.filter(isPublishedHotspot);
        setIsOffline(false);
        setCachedAt(Date.now());
        saveCache(CACHE_KEY, fresh);
        return fresh;
      } catch (error) {
        setIsOffline(true);
        throw error;
      }
    },
    staleTime: 3 * 60 * 1000,      // refetch after 3 min
    gcTime: 30 * 60 * 1000,         // keep in memory for 30 min
    retry: 1,
  });

  // A previously populated in-memory React Query cache can outlive this hook's
  // IndexedDB seeding path. Filter again at the return boundary so no stale
  // legacy or hold record can escape to any caller.
  const data = useMemo(
    () => Array.isArray(rawData) ? rawData.filter(isPublishedHotspot) : [],
    [rawData],
  );

  // Show loading spinner only when we have NO data at all (first cold start)
  const isLoading = isFetching && data.length === 0;

  return { data, isLoading, isOffline, cachedAt, error: null, refetch };
}
