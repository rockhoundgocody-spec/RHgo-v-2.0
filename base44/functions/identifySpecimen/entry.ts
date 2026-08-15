/**
 * identifySpecimen — Great Lakes regional specialist AI rock identification.
 *
 * POST /identifySpecimen
 * Body: { image_url?, specimen_id?, lat?, lng?, save?, share_to_map?, geo_privacy?, prefilled_result?,
 *         wet_dry?, beach_name?, post_storm?, season? }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { handbookPromptBlock, applyHandbook } from '../../shared/operatingHandbook.ts';
import { computeContextIntegrity } from '../../shared/contextIntegrity.ts';
import { computeEssence } from '../../shared/essence.ts';

// ── Agate subtypology prompt enrichment (inline — Deno has no local imports) ─
const AGATE_PROMPT_BLOCK = `AGATE SUBTYPOLOGY: When the specimen is an agate or chalcedony, identify the SPECIFIC variety — not just "agate." Key varieties and their diagnostic features:
- Lake Superior Agate: razor-sharp fortification banding, brick-red/orange/carnelian, water-worn, Great Lakes region.
- Fairburn Agate: needle-point "holly leaf" fortification, extreme color contrast (crimson/pink/yellow/cream), chert rind, Black Hills SD.
- Montana Moss Agate: clear/translucent chalcedony, black MnO2 + reddish Fe-oxide dendrites forming landscape/foliage motifs, Yellowstone River MT.
- Ellensburg Blue: sky-blue to royal-blue, Rayleigh scattering, high hardness (7.5), Central Washington. Very rare.
- Coyamito Agate: ultra-fine fortification in magenta/pink/yellow/purple, pseudomorphs of aragonite/calcite sprays, Chihuahua Mexico.
- Fire Agate: botryoidal habit, iridescent thin-film goethite/limonite layers, Schiller effect, SW USA/Mexico.
- Iris Agate: ultra-fine periodic banding that diffracts light into rainbow spectrum when backlit.
- Plume Agate: 3D feather/cloud/shrub inclusions of iron/manganese oxides or marcasite.
- Sagenite Agate: radiating needle sprays (goethite, rutile, aragonite) in translucent chalcedony.
- Dendritic/Moss Agate: branching moss-like or tree-like inclusions (chlorite, celadonite, pyrolusite).
- Enhydro Agate: trapped liquid + mobile air bubbles in sealed cavities.
- Pseudomorphic Agate: silica preserving external crystal geometry of replaced aragonite, anhydrite, or calcite.
- Polyhedroid Agate: flat-faced geometric multi-sided nodules constrained by volcanic crystal faces.
- Shadow/Parallax Agate: alternating transparent and opaque bands creating 3D chatoyant shadow effect.
- Blue Lace Agate: pale blue and white delicate lace-like swirling banding, Namibia.
- Botswana Agate: small nodules, fine tightly packed purple/pink/black/grey/white bands, Botswana.
- Crazy Lace Agate: chaotic twisting lace patterns in white/red/yellow/grey, Mexico.
- Brazilian Agate: large nodules, pale yellow/gray/colorless fine concentric banding (often dyed commercially), Brazil.
- Condor Agate: bright red and yellow fortification banding, sometimes mossy/sagenitic inclusions, Argentina.
- Dugway Geode: light grey/blue thunder eggs with hollow drusy quartz cavities, Utah USA.
- Priday Blue Bed Thunder Egg: blue and white level-banded agate in dark brown shell, Oregon USA.
- Laguna Agate: ultra-tight vivid fortification banding (50+ bands/cm) in scarlet/orange/yellow/pink/purple, Chihuahua Mexico.
- Turritella Agate: dark chert packed with silicified freshwater gastropod fossils (Elimia tenera), Wyoming USA.
- Dendritic Agate: fern/tree-like manganese or iron oxide dendrites on or between bands, worldwide.
- Sagenitic Agate: radiating needle sprays (goethite, rutile, aragonite, anhydrite) in translucent chalcedony.
Use the banding pattern, inclusion type, color spectrum, and locality to determine the variety.`;

// ── Great Lakes 30-class list (inline — no local imports in Deno) ────────────
const GL_30 = [
  'Lake Superior Agate', 'Petoskey Stone', 'Charlevoix Stone', 'Leland Blue',
  'Yooperlite', 'Pudding Stone', 'Jacobsville Sandstone', 'Native Copper',
  'Prehnite', 'Thomsonite', 'Chlorastrolite (Greenstone)', 'Epidote',
  'Basalt (Lake Superior)', 'Rhyolite', 'Granite', 'Quartzite',
  'Quartz (milky)', 'Quartz (clear/smoky)', 'Chert / Flint', 'Carnelian',
  'Jasper', 'Obsidian', 'Diorite', 'Gabbro', 'Schist', 'Gneiss',
  'Limestone', 'Dolomite', 'Slag Glass', 'Copper Ore (Conglomerate)',
];

const BEACH_PRIORS = {
  'eagle river': ['Lake Superior Agate', 'Native Copper', 'Basalt (Lake Superior)', 'Jacobsville Sandstone'],
  'grand marais': ['Lake Superior Agate', 'Thomsonite', 'Carnelian', 'Jasper'],
  'whitefish': ['Lake Superior Agate', 'Basalt (Lake Superior)', 'Quartzite'],
  'petoskey': ['Petoskey Stone', 'Charlevoix Stone', 'Leland Blue', 'Limestone'],
  'charlevoix': ['Charlevoix Stone', 'Petoskey Stone'],
  'leland': ['Leland Blue', 'Slag Glass', 'Quartzite'],
  'keweenaw': ['Native Copper', 'Jacobsville Sandstone', 'Chlorastrolite (Greenstone)', 'Copper Ore (Conglomerate)'],
  'copper harbor': ['Native Copper', 'Basalt (Lake Superior)', 'Copper Ore (Conglomerate)'],
  'marquette': ['Jacobsville Sandstone', 'Basalt (Lake Superior)', 'Quartzite'],
  'isle royale': ['Chlorastrolite (Greenstone)', 'Native Copper', 'Basalt (Lake Superior)'],
  'sleeping bear': ['Leland Blue', 'Slag Glass', 'Petoskey Stone'],
  'ludington': ['Lake Superior Agate', 'Limestone', 'Chert / Flint'],
  'thomsonite beach': ['Thomsonite', 'Prehnite', 'Basalt (Lake Superior)'],
};

function buildGreatLakesContext({ beachName, wetDry, postStorm, season }) {
  const classList = GL_30.join(', ');
  const beach = (beachName || '').toLowerCase();

  // Location priors
  let priorStr = '';
  for (const [key, stones] of Object.entries(BEACH_PRIORS)) {
    if (beach.includes(key)) {
      priorStr = `BEACH PRIORS for ${beachName}: Strongly boost ${stones.join(', ')}.`;
      break;
    }
  }

  const wetNote = wetDry === 'wet'
    ? 'CONDITION: Specimen is WET. Colors and patterns are vivid. Waxy lusters enhanced. Agate banding, Petoskey coral patterns, and Leland Blue glass are most identifiable wet. Increase confidence for pattern-dependent stones.'
    : wetDry === 'dry'
    ? 'CONDITION: Specimen is DRY. Surface may appear chalky/muted. Petoskey patterns may be nearly invisible dry. Luster reduced. Adjust confidence down slightly for pattern-dependent IDs.'
    : '';

  const stormNote = postStorm
    ? 'POST-STORM CONDITIONS: Fresh specimens recently exposed. Boost Lake Superior Agate, basalt, copper ore, and quartzite priors. Hunters find agates freshly washed up after northeast blows.'
    : '';

  const seasonNote = season === 'spring'
    ? 'SPRING THAW: Prime hunting season. Ice-transported fresh specimens common.'
    : season === 'winter'
    ? 'WINTER: Cold conditions, possible ice/frost on surface. Account for surface alteration in ID.'
    : '';

  return [
    'GREAT LAKES REGIONAL SPECIALIST MODE.',
    `RESTRICT your identification to this 30-class Great Lakes list: ${classList}.`,
    'Penalize tropical, desert, or globally-rare minerals unless visual evidence is overwhelming.',
    'These are WATER-WORN beach stones — ignore facets/terminations. Focus on luster, color pattern, density, translucency, banding, and inclusions.',
    priorStr,
    wetNote,
    stormNote,
    seasonNote,
    'For each candidate include a one-sentence FIELD CLUE the hunter can check on the beach without tools.',
  ].filter(Boolean).join(' ');
}

type LocationSubmissionRecord = { id: string; status: string };
type LocationSpecimen = {
  id: string;
  mineral_name?: string;
  lat?: number | null;
  lng?: number | null;
};
type LocationReviewClient = {
  asServiceRole: {
    entities: {
      LocationSubmission: {
        filter(
          query: Record<string, unknown>,
          sort: string,
          limit: number,
        ): Promise<LocationSubmissionRecord[]>;
        create(data: Record<string, unknown>): Promise<LocationSubmissionRecord>;
      };
    };
  };
};

async function submitLocationForReview(
  base44: LocationReviewClient,
  user: { email: string },
  specimen: LocationSpecimen,
) {
  if (specimen?.lat == null || specimen?.lng == null) {
    throw new Error('A saved private specimen location is required for review');
  }

  const existing = await base44.asServiceRole.entities.LocationSubmission.filter(
    { specimen_id: specimen.id, owner_email: user.email, status: 'pending' },
    '-created_date',
    1,
  );
  if (existing[0]) return existing[0];

  // This queue record deliberately contains no coordinates, images, free-text
  // notes, or public hotspot fields. An administrator must review the private
  // owner-only Specimen and create a separate governed Hotspot if appropriate.
  return base44.asServiceRole.entities.LocationSubmission.create({
    specimen_id: specimen.id,
    mineral_name: specimen.mineral_name || 'Unknown specimen',
    owner_email: user.email,
    status: 'pending',
    submission_type: 'user_find',
    requested_at: new Date().toISOString(),
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      image_url, specimen_id, lat, lng,
      save = false, share_to_map = false,
      geo_privacy = 'private',
      prefilled_result = null,
      wet_dry = null,
      beach_name = null,
      post_storm = false,
      season = null,
    } = body;

    // Backward-compatible share_to_map requests are now moderation submissions.
    // Resolve the specimen through user-scoped RLS so a caller cannot submit
    // another user's exact location, then return before any LLM or geo lookup.
    if (share_to_map && specimen_id && !save) {
      const specimen = await base44.entities.Specimen.get(specimen_id);
      if (!specimen) return Response.json({ error: 'Specimen not found' }, { status: 404 });
      try {
        const submission = await submitLocationForReview(base44, user, specimen);
        return Response.json({
          success: true,
          location_submission: { id: submission.id, status: submission.status },
          hotspot_contribution: null,
        });
      } catch (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }
    }

    if (share_to_map && !save) {
      return Response.json({ error: 'specimen_id is required for location review' }, { status: 400 });
    }

    if (!image_url) return Response.json({ error: 'image_url is required' }, { status: 400 });

    // ── LOCAL GEOLOGY CONTEXT (Macrostrat) ────────────────────────────────────
    let geologyContext = '';
    let localGeology = null;
    if (lat != null && lng != null) {
      try {
        const geoRes = await fetch(`https://macrostrat.org/api/v2/geologic_units/map?lat=${lat}&lng=${lng}`);
        if (geoRes.ok) {
          const geoJson = await geoRes.json();
          const units = geoJson?.success?.data || [];
          if (units.length) {
            localGeology = units.slice(0, 3).map((u) => ({
              name: u.name || u.strat_name, age: u.age, lithology: u.lith,
            }));
            geologyContext = ' LOCAL GEOLOGY (Macrostrat): ' +
              localGeology.map((u) => [u.name, u.age && `age: ${u.age}`, u.lithology && `lith: ${u.lithology}`].filter(Boolean).join(' | ')).join('; ') +
              ' Weight geologically plausible candidates higher.';
          }
        }
      } catch {}
    }

    // ── GREAT LAKES CONTEXT ───────────────────────────────────────────────────
    // Auto-detect if we're in the Great Lakes region (~lat 41-48, lng -76 to -92)
    const isGreatLakes = lat != null && lng != null
      ? (lat >= 41 && lat <= 48 && lng >= -92 && lng <= -76)
      : true; // default to GL mode if no GPS

    const glContext = isGreatLakes
      ? buildGreatLakesContext({ beachName: beach_name, wetDry: wet_dry, postStorm: post_storm, season })
      : '';

    // ── SELF-IMPROVEMENT LOOP ─────────────────────────────────────────────────
    // Feed verified community corrections back into the model as priors, so the
    // identifier learns from every confirmed mistake without retraining.
    let learnedContext = '';
    try {
      const corrections = await base44.asServiceRole.entities.TrainingCandidate.filter(
        { status: 'accepted' }, '-created_date', 15
      );
      const lessons = corrections
        .filter((c) => c.user_label && c.predicted_label && c.user_label !== c.predicted_label)
        .map((c) => `previously misidentified "${c.user_label}" as "${c.predicted_label}"${c.user_notes ? ` — ${c.user_notes}` : ''}`);
      if (lessons.length) {
        learnedContext = ' LEARNED CORRECTIONS (verified user feedback — weigh these as priors and avoid repeating them): ' +
          lessons.join('; ') + '.';
      }
    } catch { /* learning context is best-effort */ }

    // ── VISION IDENTIFICATION ─────────────────────────────────────────────────
    let identification = prefilled_result;
    if (!identification) {
      identification = await base44.integrations.Core.InvokeLLM({
        model: 'gemini_3_flash',
        prompt:
          'You are an expert field geologist and mineralogist analyzing a specimen photo. ' +
          'Study every visual detail: crystal habit, luster, transparency, color zoning, cleavage, fracture, surface texture, matrix, weathering. ' +
          'Provide: top_match, scientific_name, hardness_mohs, crystal_system, chemical_formula, formation, where_to_find, value_estimate, rarity, confidence, description, reasoning, fun_fact, collection_value, image_quality_score, observed_features, lookalikes, verification_tests, candidates. ' +
          'Never refuse — always give best attempt with calibrated confidence. ' +
          AGATE_PROMPT_BLOCK + ' ' +
          handbookPromptBlock() +
          glContext + geologyContext + learnedContext,
        file_urls: [image_url],
        response_json_schema: {
          type: 'object',
          properties: {
            top_match:           { type: 'string' },
            scientific_name:     { type: 'string' },
            hardness_mohs:       { type: 'number' },
            crystal_system:      { type: 'string' },
            chemical_formula:    { type: 'string' },
            formation:           { type: 'string' },
            where_to_find:       { type: 'array', items: { type: 'string' } },
            value_estimate:      { type: 'string' },
            rarity:              { type: 'string', enum: ['common', 'uncommon', 'rare', 'legendary'] },
            confidence:          { type: 'number' },
            description:         { type: 'string' },
            reasoning:           { type: 'string' },
            fun_fact:            { type: 'string' },
            collection_value:    { type: 'string' },
            image_quality_score: { type: 'number' },
            field_clue:          { type: 'string' },
            wet_dry_note:        { type: 'string' },
            observed_features: {
              type: 'array',
              items: { type: 'object', properties: { feature: { type: 'string' }, value: { type: 'string' } } },
            },
            lookalikes: {
              type: 'array',
              items: { type: 'object', properties: { name: { type: 'string' }, differentiator: { type: 'string' } } },
            },
            verification_tests: {
              type: 'array',
              items: { type: 'object', properties: { test: { type: 'string' }, expected: { type: 'string' } } },
            },
            candidates: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' }, confidence: { type: 'number' },
                  features: { type: 'string' }, rationale: { type: 'string' },
                },
              },
            },
          },
        },
      });
    }

    if (!identification) return Response.json({ error: 'Identification failed' }, { status: 500 });

    // ── CONTEXT INTEGRITY + OPERATING HANDBOOK ENFORCEMENT ────────────────────
    const contextIntegrity = computeContextIntegrity({
      imageCount: 1,
      imageQualityScore: identification.image_quality_score ?? null,
      hasGps: lat != null && lng != null,
      geologyUnitCount: localGeology ? localGeology.length : 0,
      hasLocality: !!beach_name,
      fieldTestCount: 0,
      conditionKnown: !!wet_dry,
      contradictionCount: 0,
    });
    const { enforcement } = applyHandbook(identification, contextIntegrity);

    // ── ESSENCE ALGORITHM: Bayesian posterior + entropy Tier 2 trigger ───────
    const candList = [...(identification.candidates || [])];
    if (identification.top_match && !candList.some((c) => c.name === identification.top_match)) {
      candList.unshift({ name: identification.top_match, confidence: identification.confidence });
    }
    // Spatial likelihood P(L|M): boost minerals known at this beach/locality
    const locationLikelihoods: Record<string, number> = {};
    const beachKey = Object.keys(BEACH_PRIORS).find((k) => (beach_name || '').toLowerCase().includes(k));
    if (beachKey) {
      for (const m of BEACH_PRIORS[beachKey]) locationLikelihoods[m] = 1.5;
    }
    const essence = computeEssence({ candidates: candList, locationLikelihoods });

    // ── OPTIONAL SAVE ─────────────────────────────────────────────────────────
    let savedSpecimen = null;
    if (save) {
      const richNotes = [
        identification.description,
        identification.scientific_name && `Scientific name: ${identification.scientific_name}`,
        identification.chemical_formula && `Formula: ${identification.chemical_formula}`,
        identification.crystal_system && `Crystal system: ${identification.crystal_system}`,
        identification.hardness_mohs != null && `Hardness: ${identification.hardness_mohs} Mohs`,
        identification.formation && `Formation: ${identification.formation}`,
        identification.value_estimate && `Value: ${identification.value_estimate}`,
        identification.fun_fact && `Fun fact: ${identification.fun_fact}`,
        identification.where_to_find?.length && `Found in: ${identification.where_to_find.join(', ')}`,
        wet_dry && `Condition when found: ${wet_dry}`,
        beach_name && `Beach: ${beach_name}`,
      ].filter(Boolean).join('\n\n');

      savedSpecimen = await base44.entities.Specimen.create({
        mineral_name:  identification.top_match,
        common_name:   identification.scientific_name || identification.top_match,
        image_url,
        ai_confidence: identification.confidence,
        ai_candidates: identification.candidates,
        notes:         richNotes,
        rarity:        identification.rarity,
        found_date:    new Date().toISOString().split('T')[0],
        found_at:      beach_name || null,
        verified:      false,
        geo_privacy:   ['exact', 'approximate', 'private'].includes(geo_privacy) ? geo_privacy : 'private',
        ...(lat != null ? { lat } : {}),
        ...(lng != null ? { lng } : {}),
      });

      const xpMap = { common: 10, uncommon: 25, rare: 60, legendary: 150 };
      // Idempotent: keyed to the specimen — retries can never double-award
      base44.functions.invoke('awardXP', {
        amount: xpMap[identification.rarity] || 10,
        reason: `Logged ${identification.top_match}`,
        idempotency_key: `specimen:${savedSpecimen.id}`,
      }).catch(() => {});

      // Queue for community verification when the handbook requires review
      if (enforcement.expert_review_required) {
        base44.asServiceRole.entities.SpecimenVerification.create({
          specimen_id: savedSpecimen.id,
          specimen_image_url: image_url,
          original_ai_guess: identification.top_match,
          original_confidence: identification.confidence,
          owner_email: user.email,
          beach_name: beach_name || null,
          wet_dry: wet_dry || null,
          status: 'pending',
          votes: [],
          vote_count: 0,
          agree_count: 0,
        }).catch(() => {});
      }
    }

    // ── OPTIONAL LOCATION REVIEW SUBMISSION ──────────────────────────────────
    let locationSubmission = null;
    if (share_to_map && savedSpecimen) {
      const submission = await submitLocationForReview(base44, user, savedSpecimen);
      locationSubmission = { id: submission.id, status: submission.status };
    }

    return Response.json({
      success: true,
      identification,
      saved_specimen_id: savedSpecimen?.id || null,
      location_submission: locationSubmission,
      hotspot_contribution: null,
      context_integrity: contextIntegrity,
      handbook: enforcement,
      essence,
      local_geology: localGeology,
      great_lakes_mode: isGreatLakes,
      meta: { model: 'gemini_3_flash', user_email: user.email, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
