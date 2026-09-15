import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { winner_mineral, opponent_mineral, xp_awarded, avatar_url } = await req.json();

    const battleResult = await base44.entities.BattleResult.create({
      owner_email: user.email,
      winner_mineral: winner_mineral || 'Unknown',
      opponent_mineral: opponent_mineral || 'Unknown',
      xp_awarded: xp_awarded || 0,
      battle_date: new Date().toISOString(),
      avatar_url_at_time: avatar_url || null
    });

    // Award XP via the awardXP function — idempotency_key prevents duplicate awards
    const xpResult = await base44.functions.invoke('awardXP', {
      amount: xp_awarded || 0,
      reason: `AR Battle win vs ${opponent_mineral || 'Unknown'}`,
      idempotency_key: `battle_${battleResult.id}`
    });

    return Response.json({ saved: true, ...xpResult.data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});