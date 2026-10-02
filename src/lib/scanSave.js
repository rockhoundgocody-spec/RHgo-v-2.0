const RARITY_WEIGHTS = { common: 1, uncommon: 2, rare: 3, legendary: 5 };

// ── Provenance & location throttle constants ──
export const PROVENANCE = { NATURE: 'nature', STORE_BOUGHT: 'store_bought' };
const STORE_BOUGHT_XP_MULTIPLIER = 0.25;
const LOCATION_SCAN_CAP = 5;       // max nature scans at one spot
const LOCATION_RADIUS_M = 250;     // "same spot" = within 250m

// Base XP by disposition (nature-found)
const NATURE_XP = { collected: 25, left_in_place: 40, observed: 15 };

export function applyGeoPrivacy(coords, privacy) {
  if (privacy === 'private') return { lat: null, lng: null };
  const lat = coords?.lat;
  const lng = coords?.lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { lat: null, lng: null };
  if (privacy === 'approximate') {
    return {
      lat: Math.round(lat * 100) / 100,
      lng: Math.round(lng * 100) / 100,
    };
  }
  return { lat, lng };
}

export function calculateRarityQualityScore(rarity, confidence) {
  const weight = RARITY_WEIGHTS[rarity] || 1;
  const numericConfidence = Number.isFinite(confidence) ? confidence : 0.5;
  return Math.round(weight * Math.min(1, Math.max(0, numericConfidence)) * 20);
}

export function buildSpecimenNotes(result) {
  return [
    result.description,
    result.scientific_name ? `Scientific name: ${result.scientific_name}` : null,
    result.chemical_formula ? `Formula: ${result.chemical_formula}` : null,
    result.crystal_system ? `Crystal system: ${result.crystal_system}` : null,
    result.hardness_mohs != null ? `Hardness: ${result.hardness_mohs} Mohs` : null,
    result.formation ? `Formation: ${result.formation}` : null,
    result.value_estimate ? `Value: ${result.value_estimate}` : null,
    result.fun_fact ? `Fun fact: ${result.fun_fact}` : null,
  ].filter(Boolean).join('\n\n');
}

/**
 * Haversine distance in meters between two {lat, lng} points.
 */
function haversineMeters(a, b) {
  if (!a || !b) return Infinity;
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Given the user's recent specimens (with lat/lng), returns how many are
 * within LOCATION_RADIUS_M of the current GPS point.
 */
export function countNearbyScans(specimens, gps) {
  if (!gps || !specimens?.length) return 0;
  return specimens.filter(s => {
    if (s.lat == null || s.lng == null) return false;
    return haversineMeters(gps, { lat: s.lat, lng: s.lng }) <= LOCATION_RADIUS_M;
  }).length;
}

/**
 * Returns the XP to award for a save, applying provenance and location throttle.
 *   - store_bought: 25% of nature XP (rounded down, min 1)
 *   - nature + location exhausted (>= LOCATION_SCAN_CAP nearby): 0 XP
 *   - nature + location fresh: full nature XP
 */
export function calculateAwardedXp({ disposition, provenance, nearbyCount }) {
  const base = NATURE_XP[disposition] ?? NATURE_XP.observed;
  if (provenance === PROVENANCE.STORE_BOUGHT) {
    return Math.max(1, Math.round(base * STORE_BOUGHT_XP_MULTIPLIER));
  }
  // nature
  if (nearbyCount >= LOCATION_SCAN_CAP) return 0;
  return base;
}

export { LOCATION_SCAN_CAP, LOCATION_RADIUS_M };