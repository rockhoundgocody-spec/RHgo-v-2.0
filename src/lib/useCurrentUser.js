import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * useCurrentUser — shared, cached current-user hook.
 * Repeated mounts of Scan / Profile / Live etc. don't re-fetch `me()`
 * within the stale window. Falls back to null when not logged in.
 */
export function useCurrentUser(options = {}) {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
    ...options,
  });
}