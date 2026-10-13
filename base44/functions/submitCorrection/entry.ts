// Records a user correction to a specimen ID. Writes a TrainingCandidate
// row that the external ML pipeline can poll and use for fine-tuning.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { safeError } from '../../shared/httpErrors.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      image_url,
      image_hash,
      predicted_label,
      predicted_confidence,
      user_label,
      user_notes,
      lat,
      lng,
      model_version,
      specimen_id,
    } = body || {};

    if (!user_label || typeof user_label !== 'string') {
      return Response.json({ error: 'user_label is required' }, { status: 400 });
    }

    // Users can't create/update candidates directly; only admins may accept them.
    const created = await base44.asServiceRole.entities.TrainingCandidate.create({
      image_url,
      image_hash,
      predicted_label: typeof predicted_label === 'string' ? predicted_label.slice(0, 80) : undefined,
      predicted_confidence,
      user_label: user_label.slice(0, 80),
      user_notes: typeof user_notes === 'string' ? user_notes.slice(0, 1000) : undefined,
      lat,
      lng,
      model_version: model_version || 'gemini-flash',
      specimen_id,
      status: 'pending',
    });

    return Response.json({ ok: true, id: created.id });
  } catch (error) {
    return safeError('submitCorrection', error);
  }
});