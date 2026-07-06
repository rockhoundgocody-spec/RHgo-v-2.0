/**
/**
 * enhanceSpecimenWithReasoning
 * 
 * Enriches a specimen with structured AI reasoning:
 * - Primary classification
 * - Confidence score (0-1, calibrated)
 * - Top alternatives (with explanations)
 * - Next verification tests
 * - Uncertainty factors
 * - Why it thinks this mineral
 * 
 * Usage (post-scan):
 *   await base44.functions.invoke('enhanceSpecimenWithReasoning', {
 *     specimen_id: 'spec_123',
 *     primary_classification: 'Quartz',
 *     confidence: 0.87,
 *     alternatives: [
 *       { mineral: 'Feldspar', confidence: 0.08, why: 'Softer (hardness 6 vs 7)' },
 *       { mineral: 'Glass', confidence: 0.05, why: 'Man-made, lacks crystal structure' }
 *     ],
 *     next_tests: [
 *       'Hardness test (scratch with steel nail)',
 *       'Streak test (scrape on ceramic)'
 *     ],
 *     reasoning: 'Vitreous luster + prismatic crystals + hardness ~7 suggest quartz...',
 *     uncertainty_factors: ['Poor lighting in original image', 'No size reference']
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
      primary_classification,
      confidence = 0.5,
      alternatives = [],
      next_tests = [],
      reasoning = '',
      uncertainty_factors = [],
    } = await req.json();

    if (!specimen_id) {
      return Response.json({ error: 'Missing specimen_id' }, { status: 400 });
    }

    // Fetch specimen
    const specimen = await base44.asServiceRole.entities.Specimen.get(specimen_id);
    if (!specimen) {
      return Response.json({ error: 'Specimen not found' }, { status: 404 });
    }

    // Check for existing reasoning
    let existingReasoning = await base44.asServiceRole.entities.IdentificationReasoning.filter({
      specimen_id,
    });
    existingReasoning = existingReasoning?.[0];

    // Create or update IdentificationReasoning record
    const reasoningData = {
      specimen_id,
      owner_email: specimen.created_by,
      primary_classification,
      confidence,
      alternatives,
      next_verification_tests: next_tests,
      reasoning_explanation: reasoning,
      uncertainty_factors,
      created_by_system: true,
      timestamp: new Date().toISOString(),
    };

    let reasoningRecord;
    if (existingReasoning) {
      // Keep history; update only if newer and higher confidence
      if (confidence > (existingReasoning.confidence || 0)) {
        reasoningRecord = await base44.asServiceRole.entities.IdentificationReasoning.update(
          existingReasoning.id,
          reasoningData
        );
      } else {
        reasoningRecord = existingReasoning;
      }
    } else {
      reasoningRecord = await base44.asServiceRole.entities.IdentificationReasoning.create(
        reasoningData
      );
    }

    // Update specimen with new classification if confidence improved
    if (confidence > (specimen.ai_confidence || 0)) {
      await base44.asServiceRole.entities.Specimen.update(specimen_id, {
        mineral_name: primary_classification,
        ai_confidence: confidence,
      });
    }

    return Response.json({
      success: true,
      reasoning_record: reasoningRecord,
      message: `Specimen enhanced with ${confidence * 100}% confidence classification`,
    });
  } catch (error) {
    console.error('enhanceSpecimenWithReasoning error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});