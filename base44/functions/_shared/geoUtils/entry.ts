/**
 * Geographic privacy utilities.
 *
 * NOTE: Backend functions are deployed independently and CANNOT import from
 * each other. This file is a reference/spec — copy the function inline into
 * any backend function that needs it.
 */

/**
 * Fuzz a lat/lng pair by a random offset up to `radiusMeters` (default 200m).
 * Used to protect specimen-find privacy: stored coordinates land somewhere
 * inside a ~200m circle around the true find location.
 *
 * Uses an equirectangular approximation — accurate enough at <1km scales.
 */
export function fuzzCoordinates(lat, lng, radiusMeters = 200) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return { lat, lng };
  const r = radiusMeters / 111320; // meters → degrees latitude
  // Uniform sample inside a disk
  const u = Math.random();
  const v = Math.random();
  const w = r * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const dLat = w * Math.cos(t);
  const dLng = (w * Math.sin(t)) / Math.cos((lat * Math.PI) / 180);
  return {
    lat: +(lat + dLat).toFixed(6),
    lng: +(lng + dLng).toFixed(6),
  };
}