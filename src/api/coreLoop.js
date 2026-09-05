/**
 * Core-loop adapter for the live RockHound-GO V2.5 API.
 *
 * Pages should import names from here instead of reaching for every entity
 * on the Base44 client. Backend functions use the user session (Authorization),
 * not the service api_key. Never put a service key in Vite / VITE_* env.
 *
 * DELETE /entities/{Name} with body {} wipes the entire collection.
 * Always go through assertSafeDeleteQuery / safeEntityDelete.
 */

export const CORE_ENTITIES = Object.freeze([
  'Specimen',
  'SpecimenDraft',
  'Hotspot',
  'ChronolithCase',
  'SpecimenVerification',
  'Subscription',
  'User',
  'PlayerProfile',
  'Mineral',
  'CollectionWeight',
]);

export const CORE_FUNCTIONS = Object.freeze([
  'identifySpecimen',
  'quickClassifySpecimen',
  'autoClassifySpecimen',
  'runDeepAnalysis',
  'grokChat',
  'investigateCase',
  'createCheckoutSession',
  'stripeWebhook',
  'getMapsKey',
  'suggestNextFinds',
  'awardXP',
  'getPlayerProfile',
]);

const PUBLIC_LAND = new Set(['public', 'blm', 'forest_service', 'state_park']);

export function isEmptyDeleteQuery(query) {
  if (query == null) return true;
  if (typeof query !== 'object') return true;
  if (Array.isArray(query)) return query.length === 0;
  return Object.keys(query).length === 0;
}

export function assertSafeDeleteQuery(query) {
  if (isEmptyDeleteQuery(query)) {
    throw new Error('Refusing empty delete query — that would wipe the entire entity.');
  }
  return query;
}

export async function safeEntityDelete(entityApi, query) {
  assertSafeDeleteQuery(query);
  return entityApi.delete(query);
}

export function isUnverifiedQuickPin(hotspot) {
  if (!hotspot) return false;
  const source = hotspot.source === 'quick_pin';
  const unknownLand = !hotspot.land_type || hotspot.land_type === 'unknown';
  const weakTrust = hotspot.trust_score == null || Number(hotspot.trust_score) <= 0.5;
  const unknownAccess = !hotspot.access_status || hotspot.access_status === 'unknown';
  return source && unknownLand && weakTrust && unknownAccess;
}

export function hotspotAccessLabel(hotspot) {
  if (isUnverifiedQuickPin(hotspot)) return 'unverified';
  return hotspot?.access_status || 'unknown';
}

export function isOpenCollectingSite(hotspot) {
  if (!hotspot || isUnverifiedQuickPin(hotspot)) return false;
  if (hotspot.access_status !== 'open') return false;
  return PUBLIC_LAND.has(hotspot.land_type);
}

export function specimenOwnedBy(specimen, user) {
  if (!specimen || !user) return false;
  const email = user.email;
  const id = user.id;
  if (email && (specimen.created_by === email || specimen.owner_email === email)) return true;
  if (id && specimen.created_by_id === id) return true;
  return false;
}

export function filterOwnedSpecimens(specimens, user) {
  if (!user) return [];
  const list = Array.isArray(specimens) ? specimens : [];
  const anyOwnership = list.some((s) => s.created_by || s.owner_email || s.created_by_id);
  if (!anyOwnership) return list;
  return list.filter((s) => specimenOwnedBy(s, user));
}

export function buildSpecimenDraftPayload({ ownerEmail, result, imageUrl, geoPrivacy = 'private', coords }) {
  if (!ownerEmail) {
    throw new Error('SpecimenDraft requires owner_email — guests must not persist drafts.');
  }
  const payload = {
    owner_email: ownerEmail,
    image_urls: imageUrl ? [imageUrl] : [],
    primary_name: result?.top_match || result?.scientific_name || 'Unknown',
    common_name: result?.scientific_name || result?.top_match || '',
    confidence: Number.isFinite(result?.confidence) ? result.confidence : 0,
    rarity: result?.rarity || 'common',
    status: 'drafting',
    revision: 1,
  };
  if (geoPrivacy === 'exact' && Number.isFinite(coords?.lat) && Number.isFinite(coords?.lng)) {
    payload.lat = coords.lat;
    payload.lng = coords.lng;
  }
  return payload;
}

export function buildChronolithInvokePayload({
  ownerEmail,
  imageUrls,
  coords,
  fieldObservations = [],
  specimenLabel = '',
  caseId = null,
}) {
  if (!ownerEmail) {
    throw new Error('ChronolithCase requires owner_email.');
  }
  return {
    owner_email: ownerEmail,
    image_urls: imageUrls || [],
    lat: coords?.lat,
    lng: coords?.lng,
    field_observations: fieldObservations,
    specimen_label: specimenLabel,
    case_id: caseId,
  };
}

export async function ensureFreeSubscription(subscriptionApi, ownerEmail) {
  if (!ownerEmail) return { tier: 'free', status: 'active', owner_email: ownerEmail };
  const rows = await subscriptionApi.filter({ owner_email: ownerEmail });
  if (rows?.[0]) return rows[0];
  return subscriptionApi.create({
    owner_email: ownerEmail,
    tier: 'free',
    status: 'active',
  });
}
