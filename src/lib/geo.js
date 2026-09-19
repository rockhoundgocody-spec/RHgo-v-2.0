const GPS_KEY = 'rhgo_last_gps';
const EARTH_MI = 3958.8;

export const PUBLIC_LAND = new Set(['public', 'blm', 'forest_service', 'state_park']);

export function haversineMi(a, b) {
  if (!a || !b || a.lat == null || b.lat == null || a.lng == null || b.lng == null) return null;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return EARTH_MI * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatDistance(mi) {
  if (mi == null || Number.isNaN(mi)) return null;
  if (mi < 0.1) return '<0.1 mi';
  if (mi < 10) return `${mi.toFixed(1)} mi`;
  return `${Math.round(mi)} mi`;
}

export function persistLastGps(coords) {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return;
  if (coords.lat < -90 || coords.lat > 90 || coords.lng < -180 || coords.lng > 180) return;
  try {
    sessionStorage.setItem(GPS_KEY, JSON.stringify({ lat: coords.lat, lng: coords.lng, t: Date.now() }));
  } catch {
    /* private mode */
  }
}

export function readLastGps(maxAgeMs = 1000 * 60 * 60 * 6) {
  try {
    const raw = sessionStorage.getItem(GPS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.lat !== 'number' || typeof parsed.lng !== 'number') return null;
    if (maxAgeMs && parsed.t && Date.now() - parsed.t > maxAgeMs) return null;
    return { lat: parsed.lat, lng: parsed.lng };
  } catch {
    return null;
  }
}

export function watchGps(onFix) {
  if (typeof onFix !== 'function') return () => {};
  const cached = readLastGps();
  if (cached) onFix(cached);
  if (!navigator.geolocation) return () => {};
  let cancelled = false;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (cancelled) return;
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      persistLastGps(coords);
      onFix(coords);
    },
    () => {},
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
  );
  return () => { cancelled = true; };
}

/**
 * Rank sites for a hunter: closer + public land + collection gaps + trust.
 */
export function rankHotspots(hotspots, { userLocation, collectedMinerals = new Set() } = {}) {
  const collected = collectedMinerals instanceof Set
    ? collectedMinerals
    : new Set([...collectedMinerals].map((m) => String(m).toLowerCase()));

  return (hotspots || [])
    .filter((h) => typeof h.lat === 'number' && typeof h.lng === 'number')
    .map((h) => {
      const distanceMi = userLocation ? haversineMi(userLocation, h) : null;
      const land = h.land_type || 'unknown';
      const publicBonus = PUBLIC_LAND.has(land) ? 18 : land === 'private' ? -12 : 0;
      const minerals = h.minerals || [];
      const gapCount = minerals.filter((m) => m && !collected.has(String(m).toLowerCase())).length;
      const trust = Number(h.trust_score) || 0.5;
      const distScore = distanceMi == null ? 0 : Math.max(0, 42 - distanceMi * 0.85);
      return {
        ...h,
        distanceMi,
        gapCount,
        huntScore: distScore + publicBonus + gapCount * 4 + trust * 20,
      };
    })
    .sort((a, b) => {
      if (a.distanceMi != null && b.distanceMi != null && Math.abs(a.distanceMi - b.distanceMi) > 2) {
        return a.distanceMi - b.distanceMi;
      }
      return (b.huntScore || 0) - (a.huntScore || 0);
    });
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
