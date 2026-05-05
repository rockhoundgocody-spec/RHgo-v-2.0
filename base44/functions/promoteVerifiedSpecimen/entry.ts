import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * promoteVerifiedSpecimen — entity automation handler.
 * Fires when a Specimen's `verified` field changes to true.
 * Creates a corresponding TrainingCandidate (status: accepted) so the
 * verified label can feed the next training run.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const caller = await base44.auth.me().catch(() => null);
    if (!caller) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { event, data, payload_too_large } = body || {};
    if (!event || event.entity_name !== 'Specimen') {
      return Response.json({ skipped: true, reason: 'not a Specimen event' });
    }

    let specimen = data;
    if (!specimen || payload_too_large) {
      specimen = await base44.asServiceRole.entities.Specimen.get(event.entity_id);
    }
    if (!specimen?.verified) {
      return Response.json({ skipped: true, reason: 'specimen not verified' });
    }
    if (!specimen.image_url || !specimen.mineral_name) {
      return Response.json({ skipped: true, reason: 'missing image_url or mineral_name' });
    }

    // Avoid duplicates if the same specimen toggles verified multiple times.
    const existing = await base44.asServiceRole.entities.TrainingCandidate.filter(
      { specimen_id: event.entity_id },
      '-created_date',
      1
    );
    if (existing && existing.length > 0) {
      return Response.json({ skipped: true, reason: 'already promoted', id: existing[0].id });
    }

    const candidate = await base44.asServiceRole.entities.TrainingCandidate.create({
      image_url: specimen.image_url,
      predicted_label: specimen.mineral_name,
      predicted_confidence: specimen.ai_confidence ?? null,
      user_label: specimen.mineral_name,
      user_notes: specimen.notes || '',
      lat: specimen.lat ?? null,
      lng: specimen.lng ?? null,
      model_version: 'verified-specimen',
      specimen_id: event.entity_id,
      status: 'accepted',
    });

    return Response.json({ created: true, id: candidate.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});