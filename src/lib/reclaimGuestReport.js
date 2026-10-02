import { base44 } from '@/api/base44Client';
import {
  applyGeoPrivacy,
  buildSpecimenNotes,
  calculateRarityQualityScore,
} from '@/lib/scanSave';
import {
  hydrateGuestStorage,
  stashPendingGuestReport,
  takePendingGuestReport,
} from '@/lib/guestDevice';
import { logCollectedWeight } from '@/components/hub/CollectionWeightTracker.jsx';
import { progressQuestsForSpecimen } from '@/lib/questProgress';

function xpForDisposition(disposition) {
  if (disposition === 'left_in_place') return 40;
  if (disposition === 'observed') return 15;
  return 25;
}

function categoryForDisposition(disposition) {
  if (disposition === 'left_in_place') return 'steward';
  if (disposition === 'observed') return 'explorer';
  return 'collector';
}

/**
 * Sync a stashed guest soft-save into the authenticated cloud path.
 * Clears the stash first (take); re-stashes on hard failure so retry can recover.
 */
export async function reclaimGuestReport() {
  try {
    await hydrateGuestStorage();
  } catch {
    /* best-effort IDB hydrate */
  }

  const pending = takePendingGuestReport();
  if (!pending?.report) return { synced: false };

  const report = pending.report;
  const result = report.result;
  const primaryUrl = report.primaryUrl;
  if (!result || !primaryUrl) return { synced: false };

  const disposition = report.disposition || 'observed';
  const fieldReport = report.fieldReport || null;
  const gpsCoords = report.gpsCoords || null;
  const beachName = report.beachName || null;

  try {
    const { lat, lng } = applyGeoPrivacy(gpsCoords, 'private');
    const rqs = calculateRarityQualityScore(result.rarity, result.confidence);
    const xp = xpForDisposition(disposition);

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
      disposition,
    });

    let specimenId = res?.data?.saved_specimen_id;
    if (!specimenId) {
      const created = await base44.entities.Specimen.create({
        mineral_name: result.top_match,
        common_name: result.scientific_name || result.top_match,
        image_url: primaryUrl,
        ai_confidence: result.confidence,
        ai_candidates: result.candidates,
        notes: buildSpecimenNotes(result),
        rarity: result.rarity,
        found_date: new Date().toISOString().split('T')[0],
        geo_privacy: 'private',
        ...(lat != null ? { lat, lng } : {}),
      });
      specimenId = created.id;
    }

    await base44.entities.Specimen.update(specimenId, {
      disposition,
      collected: disposition === 'collected',
      left_in_place: disposition === 'left_in_place',
      legal_status: 'user_confirmed',
      ethics_prompt_shown: true,
      user_confirmed_legal_access: true,
      geo_privacy: 'private',
      rarity_quality_score: rqs,
      xp_awarded: xp,
      ...(fieldReport?.field_habit ? { field_habit: fieldReport.field_habit } : {}),
      ...(fieldReport?.field_luster ? { field_luster: fieldReport.field_luster } : {}),
      ...(fieldReport?.field_matrix ? { field_matrix: fieldReport.field_matrix } : {}),
      ...(fieldReport?.field_next_test ? { field_next_test: fieldReport.field_next_test } : {}),
    });

    const currentUser = await base44.auth.me().catch(() => null);
    if (currentUser?.email) {
      try {
        // If identifySpecimen didn't save (fallback path), award disposition XP server-side
        if (!res?.data?.saved_specimen_id) {
          await base44.functions.invoke('awardVerifiedXP', {
            event_type: 'specimen',
            event_id: specimenId,
            disposition,
          });
        }
      } catch {
        /* best-effort — specimen already saved */
      }

      const category = categoryForDisposition(disposition);
      const empty = { collector: 0, steward: 0, scientist: 0, explorer: 0, mentor: 0 };
      try {
        const profiles = await base44.entities.PlayerProfile.filter({
          owner_email: currentUser.email,
        });
        if (profiles[0]) {
          const cats = { ...empty, ...(profiles[0].xp_categories || {}) };
          cats[category] = (cats[category] || 0) + xp;
          // Categories only — awardXP owns total_xp
          await base44.entities.PlayerProfile.update(profiles[0].id, {
            xp_categories: cats,
          });
        }
      } catch {
        /* best-effort */
      }

      if (disposition === 'collected') logCollectedWeight(currentUser.email);
      try {
        await progressQuestsForSpecimen(
          { ...result, id: specimenId, image_url: primaryUrl },
          currentUser.email,
        );
      } catch {
        /* best-effort */
      }
    }

    return {
      synced: true,
      specimenId,
      mineralName: result.top_match || null,
      disposition,
    };
  } catch (err) {
    // Preserve stash so a later session can retry
    try {
      stashPendingGuestReport(report);
    } catch {
      /* ignore */
    }
    throw err;
  }
}