import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Tiny wrapper around base44.entities.<Name>.list() with sensible
 * stale times — repeated mounts of the same page don't refetch
 * within 60s.
 */
export function useEntityList(entityName, sortKey, options = {}) {
  return useQuery({
    queryKey: ['entity', entityName, 'list', sortKey ?? null],
    queryFn: () => {
      const e = base44.entities[entityName];
      return sortKey ? e.list(sortKey) : e.list();
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    ...options,
  });
}