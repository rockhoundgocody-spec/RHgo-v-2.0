// deno-lint-ignore-file
/**
 * promoteVerifiedSpecimen
 * Converts a SpecimenDraft to a final Specimen record upon user confirmation.
 * Automatically awards Companion XP as part of the workflow.
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
      draft_id,
      mineral_name,
      common_name,
      rarity = 'common',
      confidence = 0.7,
      image_urls = [],
      lat,
      lng,
      notes = '',
    } = await req.json();

    // Create the final Specimen record
    const specimen = await base44.entities.Specimen.create({
      mineral_name,
      common_name,
      rarity,
      ai_confidence: confidence,
      image_url: image_urls[0] || null,
      verified: true,
      lat,
      lng,
      found_date: new Date().toISOString().split('T')[0],
      notes,
      created_by: user.email,
    });

    // Award Companion XP
    const xpResult = await base44.functions.invoke('awardCompanionXPOnCollection', {
      specimen_id: specimen.id,
      mineral_name,
      rarity,
      confidence,
    });

    // Optionally archive the draft
    if (draft_id) {
      // You could mark draft as "finalised" here if tracking that state
      console.log(`Specimen promoted from draft ${draft_id}`);
    }

    return Response.json({
      status: 'success',
      specimen_id: specimen.id,
      xp_awarded: xpResult.data?.xp_awarded || 0,
      companion_level: xpResult.data?.new_level || 1,
    });
  } catch (error) {
    console.error('Promotion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});