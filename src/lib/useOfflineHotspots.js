/**
 * Hotspot loader with offline fallback.
 *
 * Strategy:
 *  1. Seed React Query's global cache from IndexedDB immediately (instant render).
 *  2. React Query fetches fresh data — cache persists across navigations so
 *     re-mounting Explore never shows an empty state.
 *  3. On network failure, keep whatever data we have and surface isOffline=true.
 */
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { saveCache, loadCache } from '@/lib/offlineCache';

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
        const existing = queryClient.getQueryData(QUERY_KEY);
        if (!existing || existing.length === 0) {
          queryClient.setQueryData(QUERY_KEY, cached.data);
          setCachedAt(cached.updatedAt);
        }
      }
    });
  }, [queryClient]);

  const { data = [], isFetching, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const fresh = await base44.entities.Hotspot.list(undefined, FETCH_LIMIT);
      setIsOffline(false);
      setCachedAt(Date.now());
      saveCache(CACHE_KEY, fresh);
      return fresh;
    },
    staleTime: 3 * 60 * 1000,      // refetch after 3 min
    gcTime: 30 * 60 * 1000,         // keep in memory for 30 min
    retry: 1,
    onError: () => setIsOffline(true),
  });

  // Show loading spinner only when we have NO data at all (first cold start)
  const isLoading = isFetching && data.length === 0;

  return { data, isLoading, isOffline, cachedAt, error: null, refetch };
}