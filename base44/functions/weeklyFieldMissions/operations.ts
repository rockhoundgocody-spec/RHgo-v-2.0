type PageFetcher<T> = (limit: number, skip: number) => Promise<T[]>;

export function chunkValues<T>(values: T[], size: number): T[][] {
  const chunkSize = Math.max(1, Math.floor(size) || 1);
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }
  return chunks;
}

export async function collectPages<T>(fetchPage: PageFetcher<T>, pageSize = 500): Promise<T[]> {
  const size = Math.max(1, Math.min(1000, Math.floor(pageSize) || 1));
  const records: T[] = [];
  let skip = 0;

  while (true) {
    const page = await fetchPage(size, skip);
    records.push(...page);
    if (page.length < size) return records;
    skip += size;
  }
}

export type SpecimenPartial = {
  id?: string;
  created_by_id?: string;
  created_date?: string;
  mineral_name?: string;
  lat?: number;
  lng?: number;
};

export type HotspotPartial = {
  id?: string;
  name?: string;
  state?: string;
  minerals?: string[];
  land_type?: string;
  access_status?: string;
  trust_score?: number;
  lat?: number;
  lng?: number;
};

export function groupSpecimensByUserId<T extends SpecimenPartial>(
  specimens: T[],
): Map<string, T[]> {
  const specimensByUserId = new Map<string, T[]>();
  for (const specimen of specimens) {
    if (!specimen.created_by_id) continue;
    let list = specimensByUserId.get(specimen.created_by_id);
    if (!list) {
      list = [];
      specimensByUserId.set(specimen.created_by_id, list);
    }
    list.push(specimen);
  }
  return specimensByUserId;
}

export function findUnvisitedHotspots<T extends HotspotPartial>(
  hotspots: T[],
  collectedSet: Set<string>,
  userLat?: number,
  userLng?: number,
): T[] {
  let unvisited = hotspots.filter((h) => {
    if (!h.minerals || h.minerals.length === 0) return false;
    return h.minerals.some((m) => !collectedSet.has(m.toLowerCase()));
  });

  if (userLat != null && userLng != null) {
    unvisited = unvisited
      .map((h) => ({
        hotspot: h,
        _dist: h.lat != null && h.lng != null ? Math.hypot(h.lat - userLat, h.lng - userLng) : 999,
      }))
      .sort((a, b) => a._dist - b._dist)
      .map((entry) => entry.hotspot);
  }

  return unvisited;
}
