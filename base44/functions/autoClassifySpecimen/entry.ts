import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * autoClassifySpecimen — entity-automation handler that fires on every new
 * Specimen. Runs the active MLModel against the specimen's image_url and
 * writes the predicted mineral_name, ai_confidence, ai_candidates, and rarity
 * back to the Specimen.
 *
 * Honors the MLModel registry contract (docs/ml-pipeline.md):
 *   - reads the active MLModel row to tag predictions with its `version`
 *   - on-device ONNX/TFLite inference happens in the PWA / native shell;
 *     server-side we use Gemini Flash vision as the cloud fallback so every
 *     find still gets identified end-to-end.
 *
 * Skips if the specimen already has a non-empty mineral_name set by the user.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth model: entity automations run without a user token.
    // Direct callers must be admin. Automation callers (no user) are allowed.
    const caller = await base44.auth.me().catch(() => null);
    if (caller && caller.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { event, data } = body || {};
    if (!event || event.type !== 'create' || event.entity_name !== 'Specimen') {
      return Response.json({ skipped: true, reason: 'not a Specimen create event' });
    }
    let specimen = data;
    if (!specimen) {
      specimen = await base44.asServiceRole.entities.Specimen.get(event.entity_id);
    }
    if (!specimen) {
      return Response.json({ skipped: true, reason: 'specimen not found' });
    }

    // Need an image to classify
    if (!specimen.image_url) {
      return Response.json({ skipped: true, reason: 'no image_url' });
    }

    // Skip if user already provided an explicit mineral_name and it isn't a placeholder
    const placeholder = !specimen.mineral_name ||
      /^(unknown|unidentified|tbd|n\/?a)$/i.test(String(specimen.mineral_name).trim());
    if (!placeholder) {
      return Response.json({ skipped: true, reason: 'mineral_name already set' });
    }

    // Resolve active model version (for tagging — actual inference is cloud)
    let modelVersion = 'gemini-flash';
    try {
      const active = await base44.asServiceRole.entities.MLModel.filter(
        { is_active: true }, '-released_at', 1
      );
      if (active?.[0]?.version) modelVersion = active[0].version;
    } catch {
      // non-fatal — keep gemini-flash tag
    }

    // Run vision classification — explainable, observational geology mode.
    const localityHint = (specimen.lat && specimen.lng)
      ? ` The specimen was found at approximately ${specimen.lat.toFixed(2)}, ${specimen.lng.toFixed(2)}. Use this locality to weigh geological plausibility.`
      : '';

    const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      prompt:
        'You are an assisted geological observation system, not an oracle. ' +
        'Identify the mineral or rock in this photo using observational geology. ' +
        'Return: (1) primary mineral_name + common_name, rarity, calibrated confidence (0-1, be conservative); ' +
        '(2) up to 3 ranked candidates each with a one-sentence rationale; ' +
        '(3) reasoning — a plain-language explanation of why primary was chosen, citing color, luster, habit, fracture, host rock; ' +
        '(4) observed_features — discrete {feature, value} pairs you actually see; ' +
        '(5) lookalikes — minerals that resemble primary and a one-line differentiator; ' +
        '(6) verification_tests — hands-on tests (streak, hardness, magnetism, acid) with expected outcome; ' +
        '(7) image_quality_score (0-1) and geological_plausibility (0-1) given any locality.' + localityHint,
      file_urls: [specimen.image_url],
      response_json_schema: {
        type: 'object',
        properties: {
          mineral_name: { type: 'string' },
          common_name: { type: 'string' },
          rarity: { type: 'string', enum: ['common', 'uncommon', 'rare', 'legendary'] },
          confidence: { type: 'number' },
          reasoning: { type: 'string' },
          image_quality_score: { type: 'number' },
          geological_plausibility: { type: 'number' },
          candidates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                rarity: { type: 'string', enum: ['common', 'uncommon', 'rare', 'legendary'] },
                confidence: { type: 'number' },
                rationale: { type: 'string' },
              },
            },
          },
          observed_features: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                feature: { type: 'string' },
                value: { type: 'string' },
              },
            },
          },
          lookalikes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                differentiator: { type: 'string' },
              },
            },
          },
          verification_tests: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                test: { type: 'string' },
                expected: { type: 'string' },
              },
            },
          },
        },
        required: ['mineral_name', 'confidence'],
      },
    });

    if (!r?.mineral_name) {
      return Response.json({ skipped: true, reason: 'no prediction' });
    }

    const updates = {
      mineral_name: r.mineral_name,
      ai_confidence: typeof r.confidence === 'number' ? r.confidence : 0.5,
      ai_candidates: Array.isArray(r.candidates) ? r.candidates : [],
      rarity: ['common', 'uncommon', 'rare', 'legendary'].includes(r.rarity) ? r.rarity : 'common',
    };
    if (r.common_name) updates.common_name = r.common_name;

    await base44.asServiceRole.entities.Specimen.update(event.entity_id, updates);

    // Append a passport entry — append-only provenance + explainability.
    try {
      await base44.asServiceRole.entities.SpecimenPassport.create({
        specimen_id: event.entity_id,
        owner_email: specimen.created_by,
        event_type: 'identification',
        primary_name: r.mineral_name,
        confidence: updates.ai_confidence,
        candidates: updates.ai_candidates,
        reasoning: r.reasoning || '',
        observed_features: Array.isArray(r.observed_features) ? r.observed_features : [],
        lookalikes: Array.isArray(r.lookalikes) ? r.lookalikes : [],
        verification_tests: Array.isArray(r.verification_tests)
          ? r.verification_tests.map((t) => ({ ...t, performed: false }))
          : [],
        image_quality_score: typeof r.image_quality_score === 'number' ? r.image_quality_score : null,
        geological_plausibility: typeof r.geological_plausibility === 'number' ? r.geological_plausibility : null,
        model_version: modelVersion,
        input_image_urls: [specimen.image_url],
        lat: specimen.lat ?? null,
        lng: specimen.lng ?? null,
      });
    } catch (e) {
      // non-fatal — Specimen update already succeeded
    }

    return Response.json({
      updated: true,
      model_version: modelVersion,
      updates,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});