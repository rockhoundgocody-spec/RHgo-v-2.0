import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Tiny wrapper around base44.entities.<Name>.list() with sensible
 * stale times — repeated mounts of the same page don't refetch
 * within 60s.
 */
export function useEntityList(entityName, sortKey, limit, options = {}) {
  // Support old 2-arg call: useEntityList(name, sort, options={})
  if (limit !== undefined && typeof limit === 'object' && !Array.isArray(limit)) {
    options = limit;
    limit = undefined;
  }
  const { fields, skip, ...queryOptions } = options;
  return useQuery({
    queryKey: ['entity', entityName, 'list', sortKey ?? null, limit ?? null, skip ?? null, fields ?? null],
    queryFn: () => {
      const e = base44.entities[entityName];
      // Optimization (Bolt): Pass fields array to base44 entity list() to project required fields only,
      // reducing network response payload size and JSON parsing memory footprint.
      return e.list(sortKey, limit, skip, fields);
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    ...queryOptions,
  });
}