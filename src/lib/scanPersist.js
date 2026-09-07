import { base44 } from '../api/base44Client';
import { buildSpecimenDraftPayload } from '../api/coreLoop';
import { queueWrite } from './offlineQueue';
import { applyGeoPrivacy, buildSpecimenNotes, calculateRarityQualityScore } from './scanSave';

export async function persistScanDraft({ ownerEmail, result, imageUrl, coords }) {
  if (!ownerEmail) return { ok: false };
  return queueWrite({
    entity: 'SpecimenDraft',
    op: 'create',
    data: buildSpecimenDraftPayload({
      ownerEmail,
      result,
      imageUrl,
      geoPrivacy: 'private',
      coords,
    }),
  });
}

export async function persistSavedSpecimen({
  result,
  primaryUrl,
  coords,
  disposition,
  beachName,
}) {
  const { lat, lng } = applyGeoPrivacy(coords, 'private');
  const rqs = calculateRarityQualityScore(result.rarity, result.confidence);
  const xp = disposition === 'left_in_place' ? 40 : disposition === 'observed' ? 15 : 25;

  let specimenId = null;
  try {
    const res = await base44.functions.invoke('identifySpecimen', {
      image_url: primaryUrl,
      lat,
      lng,
      save: true,
      share_to_map: false,
      geo_privacy: 'private',
      prefilled_result: result,
      wet_dry: 'dry',
      beach_name: beachName,
    });
    specimenId = res?.data?.saved_specimen_id || null;
  } catch {
    specimenId = null;
  }

  if (!specimenId) {
    const createdWrite = await queueWrite({
      entity: 'Specimen',
      op: 'create',
      data: {
        mineral_name: result.top_match,
        common_name: result.scientific_name || result.top_match,
        image_url: primaryUrl,
        ai_confidence: result.confidence,
        ai_candidates: result.candidates,
        notes: buildSpecimenNotes(result),
        rarity: result.rarity,
        found_date: new Date().toISOString().split('T')[0],
        geo_privacy: 'private',
        ...(lat != null ? { lat, lng } : { lat: null, lng: null }),
      },
    });
    specimenId = createdWrite?.result?.id;
  }

  if (specimenId) {
    await queueWrite({
      entity: 'Specimen',
      op: 'update',
      id: specimenId,
      data: {
        disposition,
        collected: disposition === 'collected',
        left_in_place: disposition === 'left_in_place',
        legal_status: 'user_confirmed',
        ethics_prompt_shown: true,
        user_confirmed_legal_access: true,
        geo_privacy: 'private',
        rarity_quality_score: rqs,
        xp_awarded: xp,
      },
    });
  }

  return { specimenId: specimenId || 'queued', xp };
}
