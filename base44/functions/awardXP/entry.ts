import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const XP_PER_LEVEL = 1200;
const MAX_LEVEL = 6;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount, reason } = await req.json();
    if (!amount) return Response.json({ error: 'Missing amount' }, { status: 400 });

    const profiles = await base44.entities.PlayerProfile.filter({ owner_email: user.email }, '-created_date', 1);
    let profile = profiles[0];

    if (!profile) {
      profile = await base44.entities.PlayerProfile.create({
        owner_email: user.email,
        total_xp: 0,
        level: 1,
        badges: [],
        streak_days: 0,
        last_login: new Date().toISOString()
      });
    }

    const newXP = (profile.total_xp || 0) + amount;
    const newLevel = Math.min(Math.floor(newXP / XP_PER_LEVEL) + 1, MAX_LEVEL);
    const leveledUp = newLevel > (profile.level || 1);

    const newBadges = leveledUp
      ? [...(profile.badges || []), { title: `Level ${newLevel} Legend`, reason, date: new Date().toISOString() }]
      : (profile.badges || []);

    await base44.entities.PlayerProfile.update(profile.id, {
      total_xp: newXP,
      level: newLevel,
      badges: newBadges,
      last_login: new Date().toISOString()
    });

    return Response.json({ newXP, newLevel, leveledUp, badges: newBadges });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});