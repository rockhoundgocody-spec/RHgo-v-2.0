/**
 * Shared server-side XP awarding — runs as service role, not as the calling user.
 * Used by backend functions that need to award XP for verified events.
 *
 * This is the ONLY path through which XP should be granted. The awardXP HTTP
 * endpoint is admin-only; client-facing flows call awardVerifiedXP which
 * validates the event and then calls this module.
 */

const XP_PER_LEVEL = 1200;
const MAX_LEVEL = 6;
const MAX_AWARD = 500;

interface AwardResult {
  newXP: number;
  newLevel: number;
  leveledUp: boolean;
  already_awarded: boolean;
}

export async function awardXPServerSide(
  base44: any,
  ownerEmail: string,
  amount: number,
  reason: string | null,
  idempotencyKey: string,
): Promise<AwardResult> {
  // Idempotency check — never award twice for the same event
  const existing = await base44.asServiceRole.entities.XPAward.filter(
    { idempotency_key: idempotencyKey, owner_email: ownerEmail },
    '-created_date',
    1,
  );
  if (existing.length) {
    const profiles = await base44.asServiceRole.entities.PlayerProfile.filter(
      { owner_email: ownerEmail },
      '-created_date',
      1,
    );
    return {
      newXP: profiles[0]?.total_xp ?? 0,
      newLevel: profiles[0]?.level ?? 1,
      leveledUp: false,
      already_awarded: true,
    };
  }

  const safeAmount = Math.min(Math.max(Math.round(amount), 1), MAX_AWARD);

  // Record ledger BEFORE mutating profile — if the update fails and the
  // client retries, the key blocks a double award.
  await base44.asServiceRole.entities.XPAward.create({
    owner_email: ownerEmail,
    idempotency_key: idempotencyKey,
    amount: safeAmount,
    reason: reason || null,
  });

  const profiles = await base44.asServiceRole.entities.PlayerProfile.filter(
    { owner_email: ownerEmail },
    '-created_date',
    1,
  );
  let profile = profiles[0];
  if (!profile) {
    profile = await base44.asServiceRole.entities.PlayerProfile.create({
      owner_email: ownerEmail,
      total_xp: 0,
      level: 1,
      badges: [],
      streak_days: 0,
      last_login: new Date().toISOString(),
    });
  }

  const newXP = (profile.total_xp || 0) + safeAmount;
  const newLevel = Math.min(Math.floor(newXP / XP_PER_LEVEL) + 1, MAX_LEVEL);
  const leveledUp = newLevel > (profile.level || 1);

  await base44.asServiceRole.entities.PlayerProfile.update(profile.id, {
    total_xp: newXP,
    level: newLevel,
    last_login: new Date().toISOString(),
  });

  return { newXP, newLevel, leveledUp, already_awarded: false };
}