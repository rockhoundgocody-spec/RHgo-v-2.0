export type PrivateSpecimenLocation = {
  id: string;
  mineral_name?: string;
  lat?: number | null;
  lng?: number | null;
};

export type GeoPrivacy = 'exact' | 'approximate' | 'private';

function isValidLatitude(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180;
}

export function hasValidPrivateLocation(specimen: PrivateSpecimenLocation): boolean {
  return isValidLatitude(specimen.lat) && isValidLongitude(specimen.lng);
}

export function getStoredLocation(
  lat: unknown,
  lng: unknown,
  requestedPrivacy: unknown,
): { geoPrivacy: GeoPrivacy; lat: number | null; lng: number | null } {
  const geoPrivacy: GeoPrivacy = requestedPrivacy === 'exact' || requestedPrivacy === 'approximate'
    ? requestedPrivacy
    : 'private';
  if (geoPrivacy === 'private' || !isValidLatitude(lat) || !isValidLongitude(lng)) {
    return { geoPrivacy, lat: null, lng: null };
  }
  if (geoPrivacy === 'approximate') {
    return {
      geoPrivacy,
      lat: Math.round(lat * 100) / 100,
      lng: Math.round(lng * 100) / 100,
    };
  }
  return { geoPrivacy, lat, lng };
}

export function buildLocationSubmission(
  specimen: PrivateSpecimenLocation,
  ownerEmail: string,
  requestedAt = new Date(),
) {
  if (!specimen.id || !hasValidPrivateLocation(specimen)) {
    throw new Error('A saved private specimen location is required for review');
  }
  if (!ownerEmail) throw new Error('An authenticated owner is required for review');

  return {
    specimen_id: specimen.id,
    mineral_name: specimen.mineral_name || 'Unknown specimen',
    owner_email: ownerEmail,
    status: 'pending',
    submission_type: 'user_find',
    requested_at: requestedAt.toISOString(),
  };
}
