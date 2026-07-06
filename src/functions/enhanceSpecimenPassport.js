/**
/**
 * enhanceSpecimenPassport
 * 
 * Records an action in a specimen's passport.
 * Creates passport if it doesn't exist.
 * 
 * Usage:
 *   await base44.functions.invoke('enhanceSpecimenPassport', {
 *     specimen_id: 'spec_123',
 *     action: 'corrected',
 *     classification_before: 'Quartz',
 *     classification_after: 'Amethyst',
 *     confidence_before: 0.65,
 *     confidence_after: 0.92,
 *     notes: 'User corrected AI classification based on color.'
 *   })
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      specimen_id,
      action,
      classification_before = null,
      classification_after = null,
      confidence_before = null,
      confidence_after = null,
      notes = '',
      ai_reasoning = null,
    } = await req.json();

    if (!specimen_id || !action) {
      return Response.json(
        { error: 'Missing specimen_id or action' },
        { status: 400 }
      );
    }

    // Fetch specimen to get owner
    const specimen = await base44.asServiceRole.entities.Specimen.get(specimen_id);
    if (!specimen) {
      return Response.json({ error: 'Specimen not found' }, { status: 404 });
    }

    // Check if passport exists
    let passport = await base44.asServiceRole.entities.SpecimenPassport.filter({
      specimen_id,
    });
    passport = passport?.[0];

    const actionEntry = {
      timestamp: new Date().toISOString(),
      action,
      actor: user.email,
      ...(classification_before && { classification_before }),
      ...(classification_after && { classification_after }),
      ...(confidence_before !== null && { confidence_before }),
      ...(confidence_after !== null && { confidence_after }),
      ...(notes && { notes }),
      ...(ai_reasoning && { ai_reasoning }),
    };

    const confidenceEntry =
      confidence_after !== null
        ? {
            timestamp: new Date().toISOString(),
            classification: classification_after || specimen.mineral_name,
            confidence: confidence_after,
            reason_for_change: action === 'corrected' ? notes : undefined,
          }
        : null;

    if (passport) {
      // Update existing passport
      const updated_log = [...(passport.action_log || []), actionEntry];
      const updated_confidence = confidenceEntry
        ? [...(passport.confidence_history || []), confidenceEntry]
        : passport.confidence_history || [];

      const updated = await base44.asServiceRole.entities.SpecimenPassport.update(
        passport.id,
        {
          action_log: updated_log,
          confidence_history: updated_confidence,
          total_corrections:
            action === 'corrected' ? (passport.total_corrections || 0) + 1 : passport.total_corrections,
          final_confidence: confidence_after !== null ? confidence_after : specimen.ai_confidence,
        }
      );
      return Response.json({ success: true, passport: updated });
    } else {
      // Create new passport
      const newPassport = await base44.asServiceRole.entities.SpecimenPassport.create({
        specimen_id,
        owner_email: specimen.created_by,
        action_log: [actionEntry],
        confidence_history: confidenceEntry ? [confidenceEntry] : [],
        total_corrections: action === 'corrected' ? 1 : 0,
        final_confidence: confidence_after || specimen.ai_confidence,
      });
      return Response.json({ success: true, passport: newPassport });
    }
  } catch (error) {
    console.error('enhanceSpecimenPassport error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});