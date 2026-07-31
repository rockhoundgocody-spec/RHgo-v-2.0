/**
 * awardXP — idempotent XP awarding service.
 *
 * Body: { amount (or xp), reason?, idempotency_key? }
 * When idempotency_key is provided, a repeated request with the same key
 * returns the original result instead of granting XP twice.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const XP_PER_LEVEL = 1200;
const MAX_LEVEL = 6;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const amount = body.amount ?? body.xp; // accept both param names
    const { reason, idempotency_key } = body;
    if (amount == null || Number.isNaN(Number(amount))) {
      return Response.json({ error: 'Missing amount' }, { status: 400 });
    }

    // ── Idempotency check: never award twice for the same event ──
    if (idempotency_key) {
      const existing = await base44.asServiceRole.entities.XPAward.filter(
        { idempotency_key, owner_email: user.email }, '-created_date', 1
      );
      if (existing.length) {
        const profiles = await base44.entities.PlayerProfile.filter({ owner_email: user.email }, '-created_date', 1);
        return Response.json({
          already_awarded: true,
          idempotency_key,
          newXP: profiles[0]?.total_xp ?? null,
          newLevel: profiles[0]?.level ?? null,
          leveledUp: false,
        });
      }
    }

    const profiles = await base44.entities.PlayerProfile.filter({ owner_email: user.email }, '-created_date', 1);
    let profile = profiles[0];

    if (!profile) {
      profile = await base44.entities.PlayerProfile.create({
        owner_email: user.email,
        total_xp: 0,
        level: 1,
        badges: [],
        streak_days: 0,
        last_login: new Date().toISOString(),
      });
    }

    // Record the ledger entry BEFORE mutating the profile — if the update
    // fails and the client retries, the key blocks a double award.
    if (idempotency_key) {
      await base44.asServiceRole.entities.XPAward.create({
        owner_email: user.email,
        idempotency_key,
        amount: Math.round(Number(amount)),
        reason: reason || null,
      });
    }

    const newXP = (profile.total_xp || 0) + Number(amount);
    const newLevel = Math.min(Math.floor(newXP / XP_PER_LEVEL) + 1, MAX_LEVEL);
    const leveledUp = newLevel > (profile.level || 1);

    const newBadges = leveledUp
      ? [...(profile.badges || []), { title: `Level ${newLevel} Legend`, reason, date: new Date().toISOString() }]
      : (profile.badges || []);

    await base44.entities.PlayerProfile.update(profile.id, {
      total_xp: newXP,
      level: newLevel,
      badges: newBadges,
      last_login: new Date().toISOString(),
    });

    return Response.json({ newXP, newLevel, leveledUp, badges: newBadges, already_awarded: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}