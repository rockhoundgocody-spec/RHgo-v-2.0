import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const GUEST_SPECIMENS_KEY = 'rhgo_guest_specimens';

export function readGuestSpecimens() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage?.getItem(GUEST_SPECIMENS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGuestSpecimen(specimen) {
  if (typeof window === 'undefined' || !specimen) return null;
  try {
    const list = readGuestSpecimens();
    const record = {
      id: specimen.id || `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      created_date: new Date().toISOString(),
      ...specimen,
    };
    const next = [record, ...list.filter((item) => item.id !== record.id)];
    window.localStorage?.setItem(GUEST_SPECIMENS_KEY, JSON.stringify(next.slice(0, 200)));
    return record;
  } catch {
    return null;
  }
}

export function getGuestSpecimen(id) {
  if (!id) return null;
  return readGuestSpecimens().find((item) => item.id === id) || null;
}

export function updateGuestSpecimen(id, patch) {
  if (typeof window === 'undefined' || !id || !patch) return null;
  try {
    const list = readGuestSpecimens();
    let updated = null;
    const next = list.map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, ...patch, updated_date: new Date().toISOString() };
      return updated;
    });
    if (updated) {
      window.localStorage?.setItem(GUEST_SPECIMENS_KEY, JSON.stringify(next));
    }
    return updated;
  } catch {
    return null;
  }
}

/**
 * Tiny wrapper around base44.entities.<Name>.list() with sensible
 * stale times — repeated mounts of the same page don't refetch
 * within 60s. Falls back cleanly for unauthenticated guest visitors.
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
    queryFn: async () => {
      const e = base44.entities[entityName];
      try {
        const rows = await e.list(sortKey, limit, skip, fields);
        if (entityName === 'Specimen') {
          const guestRows = readGuestSpecimens();
          if (guestRows.length > 0 && (!rows || rows.length === 0)) return guestRows;
        }
        return rows || [];
      } catch {
        if (entityName === 'Specimen') {
          return readGuestSpecimens();
        }
        return [];
      }
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    ...queryOptions,
  });
}