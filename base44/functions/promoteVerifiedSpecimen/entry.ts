import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * promoteVerifiedSpecimen — entity automation handler.
 * Fires when a Specimen's `verified` field changes to true.
 *
 * 1. Creates a TrainingCandidate (accepted) so the verified label feeds the next training run.
 * 2. Awards XP to the owner's Companion (rarity + confidence bonuses, first-find bonus).
 *
 * Auth model: entity automations run without a user token — use asServiceRole exclusively.
 * Direct (non-automation) callers must be authenticated as admin.
 *
 * Shared level curve (same as dailyCheckIn):
 *   Each level costs level * 50 XP  (L1→L2 = 50, L2→L3 = 100, …)
 */

function applyXP(currentXP, currentLevel, xpToAdd) {
  let xp = currentXP + xpToAdd;
  let level = currentLevel;
  let leveledUp = false;
  while (xp >= level * 50) {
    xp -= level * 50;
    level += 1;
    leveledUp = true;
  }
  return { xp, level, leveledUp };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data, payload_too_large } = body || {};

    // ── Auth: allow entity automations (no user token) or admin direct calls ──
    const caller = await base44.auth.me().catch(() => null);
    const isAutomation = !event?.type === undefined || !caller; // automations have no caller
    if (caller && caller.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // ── Gate: must be a Specimen event ───────────────────────────────────────
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

    // ── 1. Training candidate (dedup guard) ───────────────────────────────────
    const existing = await base44.asServiceRole.entities.TrainingCandidate.filter(
      { specimen_id: event.entity_id },
      '-created_date',
      1
    );
    let trainingId = null;
    if (existing && existing.length > 0) {
      trainingId = existing[0].id;
    } else {
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
      trainingId = candidate.id;
    }

    // ── 2. Award XP to Companion ───────────────────────────────────────────────
    const ownerEmail = specimen.created_by;
    if (!ownerEmail) {
      return Response.json({ created: true, id: trainingId, xp: null, reason: 'no owner email' });
    }

    const companions = await base44.asServiceRole.entities.Companion.filter(
      { owner_email: ownerEmail },
      'created_date',
      1
    );
    if (!companions || companions.length === 0) {
      return Response.json({ created: true, id: trainingId, xp: null, reason: 'no companion found' });
    }

    const companion = companions[0];

    // XP calculation — rarity bonus + high-confidence bonus + first-find bonus
    const rarityBonus = { common: 0, uncommon: 5, rare: 15, legendary: 30 };
    let xpAward = 10 + (rarityBonus[specimen.rarity] || 0);
    if ((specimen.ai_confidence || 0) >= 0.9) xpAward += 5;

    // First-find bonus: is this the only specimen with this mineral for this user?
    const priorFinds = await base44.asServiceRole.entities.Specimen.filter(
      { created_by: ownerEmail },
      'created_date',
      50
    );
    const otherFinds = priorFinds.filter(
      (s) => s.mineral_name === specimen.mineral_name && s.id !== event.entity_id
    );
    const firstFind = otherFinds.length === 0;
    if (firstFind) xpAward += 10;

    const { xp, level, leveledUp } = applyXP(
      companion.xp ?? 0,
      companion.level ?? 1,
      xpAward
    );

    await base44.asServiceRole.entities.Companion.update(companion.id, { xp, level });

    return Response.json({
      created: true,
      id: trainingId,
      xp: { awarded: xpAward, new_total: xp, new_level: level, leveled_up: leveledUp, first_find: firstFind },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});