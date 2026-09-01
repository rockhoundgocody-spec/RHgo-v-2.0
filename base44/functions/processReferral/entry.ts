import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * processReferral — handles the gamified referral lifecycle.
 *
 * Actions:
 *   create   — generate a new referral code for the current user
 *   redeem   — mark a referral as completed when an invitee signs up,
 *              then award companion XP to the inviter
 *   stats    — return the inviter's referral stats (total, completed, pending)
 */
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'stats';

    // ── CREATE: generate a new referral code ──
    if (action === 'create') {
      const code = 'CLOVER-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const referral = await base44.entities.Referral.create({
        referral_code: code,
        inviter_email: user.email,
        status: 'pending',
        companion_xp_bonus: 50,
      });
      return Response.json({ referral, referralCode: code });
    }

    // ── REDEEM: invitee signs up with a referral code ──
    if (action === 'redeem') {
      const { code } = body;
      if (!code) return Response.json({ error: 'Missing referral code' }, { status: 400 });

      // Find the pending referral
      const referrals = await base44.asServiceRole.entities.Referral.filter({
        referral_code: code,
        status: 'pending',
      });
      if (!referrals || referrals.length === 0) {
        return Response.json({ error: 'Invalid or already used referral code' }, { status: 404 });
      }
      const referral = referrals[0];

      // Don't let users refer themselves
      if (referral.inviter_email === user.email) {
        return Response.json({ error: 'Cannot use your own referral code' }, { status: 400 });
      }

      // Mark as completed
      const updated = await base44.asServiceRole.entities.Referral.update(referral.id, {
        status: 'completed',
        invitee_email: user.email,
        completed_at: new Date().toISOString(),
      });

      // Award companion XP to the inviter
      const inviterCompanions = await base44.asServiceRole.entities.Companion.filter({
        owner_email: referral.inviter_email,
      });
      if (inviterCompanions && inviterCompanions.length > 0) {
        const companion = inviterCompanions[0];
        const newXp = (companion.xp || 0) + (referral.companion_xp_bonus || 50);
        const newLevel = Math.floor(newXp / 100) + 1;
        await base44.asServiceRole.entities.Companion.update(companion.id, {
          xp: newXp,
          level: Math.max(companion.level || 1, newLevel),
          mood: 'radiant',
        });
      }

      return Response.json({ success: true, referral: updated, xpAwarded: referral.companion_xp_bonus });
    }

    // ── STATS: inviter's referral dashboard ──
    const allReferrals = await base44.entities.Referral.filter({
      inviter_email: user.email,
    });
    const completed = allReferrals.filter(r => r.status === 'completed');
    const pending = allReferrals.filter(r => r.status === 'pending');
    const totalXp = completed.reduce((sum, r) => sum + (r.companion_xp_bonus || 0), 0);

    return Response.json({
      total: allReferrals.length,
      completed: completed.length,
      pending: pending.length,
      totalXpAwarded: totalXp,
      referrals: allReferrals,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}