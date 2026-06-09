/**
 * identifySpecimen — REST-ready AI rock identification endpoint.
 *
 * POST /identifySpecimen
 * Body: { image_url: string, lat?: number, lng?: number, save?: boolean, share_to_map?: boolean }
 *
 * Returns full identification result + optional saved specimen ID.
 * Works for both in-app SDK calls and direct mobile API calls.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { image_url, lat, lng, save = false, share_to_map = false } = body;

    if (!image_url) {
      return Response.json({ error: 'image_url is required' }, { status: 400 });
    }

    // ── VISION IDENTIFICATION ──────────────────────────────────────────────
    const identification = await base44.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      prompt:
        'You are an expert field geologist and mineralogist analyzing a specimen photo. ' +
        'Study every visual detail: crystal habit, luster (vitreous/metallic/pearly/resinous/adamantine), ' +
        'transparency, color zoning, cleavage planes, fracture type, crystal system, surface texture, matrix rock, weathering. ' +
        'Provide: ' +
        'top_match (specific mineral name), ' +
        'scientific_name (full mineralogical name if different), ' +
        'hardness_mohs (Mohs scale value or range, number), ' +
        'crystal_system (cubic/hexagonal/tetragonal/orthorhombic/monoclinic/triclinic/amorphous), ' +
        'chemical_formula (e.g. SiO2), ' +
        'formation (how this mineral forms geologically, 1-2 sentences), ' +
        'where_to_find (top 3 US states or global regions known for this mineral), ' +
        'value_estimate (rough specimen value range, e.g. "$5-20 for typical specimens"), ' +
        'rarity (common/uncommon/rare/legendary — based on specimen quality AND mineral scarcity), ' +
        'confidence (0-1, calibrated — be conservative), ' +
        'description (2 sentences for an excited young explorer), ' +
        'reasoning (specific visual features that led to this ID), ' +
        'fun_fact (one surprising geological or cultural fact), ' +
        'collection_value (what makes this specimen collectible), ' +
        'image_quality_score (0-1), ' +
        'observed_features (array of {feature, value} pairs actually seen), ' +
        'lookalikes (top 2-3 with one decisive differentiator test each), ' +
        'verification_tests (3-5 ranked field tests with expected outcome), ' +
        'candidates (top 3 alternative IDs with confidence, features, rationale). ' +
        'Never refuse — always give best attempt with appropriate confidence.',
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
                name:       { type: 'string' },
                confidence: { type: 'number' },
                features:   { type: 'string' },
                rationale:  { type: 'string' },
              },
            },
          },
        },
      },
    });

    // ── OPTIONAL SAVE TO COLLECTION ────────────────────────────────────────
    let savedSpecimen = null;
    if (save) {
      savedSpecimen = await base44.entities.Specimen.create({
        mineral_name:  identification.top_match,
        common_name:   identification.top_match,
        image_url,
        ai_confidence: identification.confidence,
        ai_candidates: identification.candidates,
        notes:         identification.description,
        rarity:        identification.rarity,
        found_date:    new Date().toISOString().split('T')[0],
        verified:      false,
        ...(lat != null ? { lat } : {}),
        ...(lng != null ? { lng } : {}),
      });
    }

    // ── OPTIONAL SHARE TO MAP (creates/updates hotspot record) ────────────
    let hotspotContribution = null;
    if (share_to_map && lat != null && lng != null && savedSpecimen) {
      // Try to find a nearby hotspot (within ~0.01 deg ≈ 1km)
      const nearby = await base44.asServiceRole.entities.Hotspot.filter({});
      const found = nearby.find(
        (h) =>
          h.lat != null &&
          h.lng != null &&
          Math.abs(h.lat - lat) < 0.01 &&
          Math.abs(h.lng - lng) < 0.01
      );

      if (found) {
        // Append mineral to existing hotspot
        const minerals = found.minerals || [];
        if (!minerals.includes(identification.top_match)) {
          minerals.push(identification.top_match);
          await base44.asServiceRole.entities.Hotspot.update(found.id, { minerals });
        }
        hotspotContribution = { type: 'updated', id: found.id };
      } else {
        // Create a user-contributed hotspot (admin review required — trust_score starts low)
        const newHotspot = await base44.asServiceRole.entities.Hotspot.create({
          name:        `${identification.top_match} Site (User Find)`,
          lat,
          lng,
          minerals:    [identification.top_match],
          land_type:   'unknown',
          difficulty:  'moderate',
          trust_score: 0.4,
          source:      `user:${user.email}`,
          description: `User-reported find: ${identification.description}`,
        });
        hotspotContribution = { type: 'created', id: newHotspot.id };
      }
    }

    return Response.json({
      success: true,
      identification,
      saved_specimen_id: savedSpecimen?.id || null,
      hotspot_contribution: hotspotContribution,
      meta: {
        model: 'gemini_3_flash',
        user_email: user.email,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});