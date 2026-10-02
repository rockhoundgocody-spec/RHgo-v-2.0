import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { awardXPServerSide } from '../../shared/awardXP.ts';

// Fixed server-side reward — never trust client-supplied xp_awarded
const BATTLE_WIN_XP = 50;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { winner_mineral, opponent_mineral, avatar_url } = await req.json();

    const battleResult = await base44.entities.BattleResult.create({
      owner_email: user.email,
      winner_mineral: winner_mineral || 'Unknown',
      opponent_mineral: opponent_mineral || 'Unknown',
      xp_awarded: BATTLE_WIN_XP,
      battle_date: new Date().toISOString(),
      avatar_url_at_time: avatar_url || null
    });

    // Award XP server-side via shared module — fixed reward, idempotent
    const xpResult = await awardXPServerSide(
      base44,
      user.email,
      BATTLE_WIN_XP,
      `AR Battle win vs ${opponent_mineral || 'Unknown'}`,
      `battle:${battleResult.id}`,
    );

    return Response.json({ saved: true, ...xpResult });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});