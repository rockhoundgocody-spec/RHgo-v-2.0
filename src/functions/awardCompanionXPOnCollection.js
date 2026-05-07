/* eslint-disable */
// deno-lint-ignore-file
/**
 * awardCompanionXPOnCollection
 * Awards Companion XP upon successful specimen identification and collection.
 * Triggered when a specimen is promoted from SpecimenDraft → Specimen.
 *
 * XP Award Logic:
 * - Base: 10 XP per specimen
 * - Rarity boost: common=0, uncommon=5, rare=15, legendary=30
 * - Confidence boost: 90%+ = +5 XP
 * - First find of species: +10 XP
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
      mineral_name,
      rarity = 'common',
      confidence = 0.7,
    } = await req.json();

    // Get or create companion
    const companions = await base44.entities.Companion.filter(
      { owner_email: user.email },
      'created_date',
      1
    );
    
    if (!companions || companions.length === 0) {
      return Response.json(
        { error: 'Companion not found. Create one first.' },
        { status: 404 }
      );
    }

    const companion = companions[0];

    // Calculate XP award
    let xpAward = 10; // Base

    // Rarity bonus
    const rarityBonus = {
      common: 0,
      uncommon: 5,
      rare: 15,
      legendary: 30,
    };
    xpAward += rarityBonus[rarity] || 0;

    // Confidence bonus (90%+ = +5 XP)
    if (confidence >= 0.9) {
      xpAward += 5;
    }

    // Check if first find of species
    const existingSpecimens = await base44.entities.Specimen.filter(
      { mineral_name, created_by: user.email },
      'created_date',
      1
    );
    
    let firstFindBonus = 0;
    if (!existingSpecimens || existingSpecimens.length === 0) {
      firstFindBonus = 10; // First time finding this mineral!
      xpAward += firstFindBonus;
    }

    // Update companion XP
    const newXP = companion.xp + xpAward;
    const levelUpThreshold = 100; // Each level requires 100 XP
    const newLevel = Math.floor(newXP / levelUpThreshold) + 1;

    await base44.entities.Companion.update(companion.id, {
      xp: newXP,
      level: newLevel,
      last_check_in_date: new Date().toISOString().split('T')[0],
    });

    // Log the award
    console.log(`Companion XP Award: +${xpAward} XP (base: 10, rarity: ${rarityBonus[rarity] || 0}, confidence: ${confidence >= 0.9 ? 5 : 0}, first find: ${firstFindBonus})`);

    return Response.json({
      status: 'success',
      xp_awarded: xpAward,
      companion_id: companion.id,
      new_xp: newXP,
      new_level: newLevel,
      breakdown: {
        base: 10,
        rarity_bonus: rarityBonus[rarity] || 0,
        confidence_bonus: confidence >= 0.9 ? 5 : 0,
        first_find_bonus: firstFindBonus,
      },
    });
  } catch (error) {
    console.error('XP Award error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});