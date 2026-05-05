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
    const body = await req.json();
    const { event, data } = body || {};
    if (!event || event.type !== 'create' || event.entity_name !== 'Specimen') {
      return Response.json({ skipped: true, reason: 'not a Specimen create event' });
    }

    const base44 = createClientFromRequest(req);
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

    // Run vision classification
    const r = await base44.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      prompt:
        'Identify the mineral or rock in this photo. Return up to 3 ranked candidates ' +
        'with common name, rarity (common, uncommon, rare, legendary), and confidence (0-1). ' +
        'Pick the single most likely mineral as the primary. Be conservative with rarity.',
      file_urls: [specimen.image_url],
      response_json_schema: {
        type: 'object',
        properties: {
          mineral_name: { type: 'string' },
          common_name: { type: 'string' },
          rarity: { type: 'string', enum: ['common', 'uncommon', 'rare', 'legendary'] },
          confidence: { type: 'number' },
          candidates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                rarity: { type: 'string', enum: ['common', 'uncommon', 'rare', 'legendary'] },
                confidence: { type: 'number' },
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

    return Response.json({
      updated: true,
      model_version: modelVersion,
      updates,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});