import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { safeError } from '../../shared/httpErrors.ts';

const MAX_PENDING_CODES = 3;
const NEW_ACCOUNT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

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
      const open = await base44.asServiceRole.entities.Referral.filter(
        { inviter_email: user.email, status: 'pending' }, '-created_date', MAX_PENDING_CODES,
      );
      if ((open?.length || 0) >= MAX_PENDING_CODES) {
        return Response.json({ referral: open[0], referralCode: open[0].referral_code });
      }
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

      // Only a genuinely new account, redeeming once, counts as a signup.
      const accountAge = Date.now() - Date.parse(user.created_date || '');
      if (!Number.isFinite(accountAge) || accountAge > NEW_ACCOUNT_WINDOW_MS) {
        return Response.json({ error: 'Referral codes are for new accounts only' }, { status: 403 });
      }
      const prior = await base44.asServiceRole.entities.Referral.filter({ invitee_email: user.email }, '-created_date', 1);
      if (prior?.length) {
        return Response.json({ error: 'You have already used a referral code' }, { status: 409 });
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
    return safeError('processReferral', error);
  }
}