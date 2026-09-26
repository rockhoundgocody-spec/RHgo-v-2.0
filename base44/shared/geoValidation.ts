/**
 * Validates latitude and longitude coordinates to prevent parameter injection,
 * out-of-bounds requests, and non-finite numeric errors when building
 * external API queries (e.g. Macrostrat, Open-Meteo, Google Maps).
 */
export function isValidCoordinatePair(lat: unknown, lng: unknown): boolean {
  if (
    lat === null ||
    lat === undefined ||
    lng === null ||
    lng === undefined ||
    typeof lat === 'boolean' ||
    typeof lng === 'boolean' ||
    typeof lat === 'symbol' ||
    typeof lng === 'symbol' ||
    typeof lat === 'object' ||
    typeof lng === 'object' ||
    typeof lat === 'function' ||
    typeof lng === 'function'
  ) {
    return false;
  }

  const numLat = Number(lat);
  const numLng = Number(lng);

  return (
    Number.isFinite(numLat) &&
    Number.isFinite(numLng) &&
    numLat >= -90 &&
    numLat <= 90 &&
    numLng >= -180 &&
    numLng <= 180
  );
}

/**
 * Parses and returns a validated coordinate object or null if invalid.
 */
export function parseCoordinates(
  lat: unknown,
  lng: unknown
): { lat: number; lng: number } | null {
  if (!isValidCoordinatePair(lat, lng)) return null;
  return { lat: Number(lat), lng: Number(lng) };
}
