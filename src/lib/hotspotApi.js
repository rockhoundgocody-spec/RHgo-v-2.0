import { base44 } from '@/api/base44Client';

/**
 * Hotspots come only through the server, which rounds coordinates to ~1 km
 * unless the user is on a paid plan and not in Stealth Mode.
 * Signed-out visitors get an empty list.
 */
export async function fetchHotspots({ sort = '-trust_score', limit = 200 } = {}) {
  try {
    const res = await base44.functions.invoke('getHotspots', { sort, limit });
    return res?.data?.hotspots || [];
  } catch (error) {
    if (error?.response?.status === 401 || error?.status === 401) return [];
    throw error;
  }
}