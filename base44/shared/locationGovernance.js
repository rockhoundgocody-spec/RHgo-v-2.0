export const PUBLICATION_STATES = Object.freeze({
  VERIFIED_COLLECTING: 'verified_managed_collecting',
  EDUCATIONAL: 'managed_educational_destination',
  RESEARCH: 'research_locality',
  HOLD: 'hold',
});

const PUBLISHED_STATES = new Set([
  PUBLICATION_STATES.VERIFIED_COLLECTING,
  PUBLICATION_STATES.EDUCATIONAL,
  PUBLICATION_STATES.RESEARCH,
]);

const MANAGED_DESTINATION_STATES = new Set([
  PUBLICATION_STATES.VERIFIED_COLLECTING,
  PUBLICATION_STATES.EDUCATIONAL,
]);

const COLLECTING_STATUSES = new Set(['allowed', 'permit_required', 'fee_dig']);
const EDUCATIONAL_STATUSES = new Set(['observation_only', 'prohibited']);
const REVIEW_MAX_AGE_DAYS = 180;

const PUBLICATION_LABELS = Object.freeze({
  [PUBLICATION_STATES.VERIFIED_COLLECTING]: 'Verified collecting site',
  [PUBLICATION_STATES.EDUCATIONAL]: 'Managed educational site',
  [PUBLICATION_STATES.RESEARCH]: 'Research locality',
  [PUBLICATION_STATES.HOLD]: 'Under review',
});

const ACCESS_LABELS = Object.freeze({
  open: 'Access verified open',
  seasonal: 'Seasonal access — verify before travel',
  permission_required: 'Permission required',
  restricted: 'Restricted access',
  closed: 'Closed',
  unverified: 'Access not verified',
});

const COLLECTION_LABELS = Object.freeze({
  allowed: 'Collecting allowed under posted rules',
  permit_required: 'Collecting permit required',
  fee_dig: 'Managed fee-dig site',
  observation_only: 'Observation only',
  prohibited: 'Collecting prohibited',
  unknown: 'Collecting rules not verified',
});

export function isPublishedHotspot(hotspot) {
  return PUBLISHED_STATES.has(hotspot?.publication_state);
}

export function isManagedDestination(hotspot) {
  return MANAGED_DESTINATION_STATES.has(hotspot?.publication_state);
}

export function getPublicationLabel(hotspot) {
  return PUBLICATION_LABELS[hotspot?.publication_state] || PUBLICATION_LABELS.hold;
}

export function getAccessLabel(hotspot) {
  return ACCESS_LABELS[hotspot?.access_status] || ACCESS_LABELS.unverified;
}

export function getCollectionLabel(hotspot) {
  return COLLECTION_LABELS[hotspot?.collection_status] || COLLECTION_LABELS.unknown;
}

export function getOfficialSourceUrl(hotspot) {
  try {
    const url = new URL(hotspot?.official_source_url);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function hasCurrentReview(hotspot, now) {
  if (!hotspot?.last_verified_at) return false;
  const verifiedAt = new Date(hotspot.last_verified_at);
  if (Number.isNaN(verifiedAt.getTime())) return false;
  const ageMs = now.getTime() - verifiedAt.getTime();
  return ageMs >= 0 && ageMs <= REVIEW_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Navigation intentionally fails closed. A land-ownership label, community
 * score, or approximate research coordinate can never unlock directions.
 */
export function getNavigationStatus(hotspot, now = new Date()) {
  if (!isPublishedHotspot(hotspot)) {
    return { allowed: false, collectionAllowed: false, reason: 'Location is still under review.' };
  }
  if (!isManagedDestination(hotspot)) {
    return { allowed: false, collectionAllowed: false, reason: 'Research localities are not navigation destinations.' };
  }
  if (hotspot.navigation_eligible !== true) {
    return { allowed: false, collectionAllowed: false, reason: 'Directions have not been approved.' };
  }
  if (hotspot.coordinate_quality !== 'verified_entrance') {
    return { allowed: false, collectionAllowed: false, reason: 'An official entrance has not been verified.' };
  }
  if (!Number.isFinite(hotspot.lat) || hotspot.lat < -90 || hotspot.lat > 90 ||
      !Number.isFinite(hotspot.lng) || hotspot.lng < -180 || hotspot.lng > 180) {
    return { allowed: false, collectionAllowed: false, reason: 'A verified entrance coordinate is required.' };
  }
  if (!getOfficialSourceUrl(hotspot)) {
    return { allowed: false, collectionAllowed: false, reason: 'An official HTTPS rules source is required.' };
  }
  if (!hasCurrentReview(hotspot, now)) {
    return { allowed: false, collectionAllowed: false, reason: 'Access and rules need a current review.' };
  }
  if (hotspot.access_status !== 'open') {
    return { allowed: false, collectionAllowed: false, reason: getAccessLabel(hotspot) };
  }

  if (hotspot.publication_state === PUBLICATION_STATES.VERIFIED_COLLECTING) {
    const collectionAllowed = COLLECTING_STATUSES.has(hotspot.collection_status);
    return collectionAllowed
      ? { allowed: true, collectionAllowed: true, reason: getCollectionLabel(hotspot) }
      : { allowed: false, collectionAllowed: false, reason: 'Collecting rules are not verified.' };
  }

  const educationalVisit = EDUCATIONAL_STATUSES.has(hotspot.collection_status);
  return educationalVisit
    ? { allowed: true, collectionAllowed: false, reason: getCollectionLabel(hotspot) }
    : { allowed: false, collectionAllowed: false, reason: 'Educational visit rules are not verified.' };
}
