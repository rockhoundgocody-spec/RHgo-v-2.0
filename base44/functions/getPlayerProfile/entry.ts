import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

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
    } else {
      await base44.entities.PlayerProfile.update(profile.id, { last_login: new Date().toISOString() });
    }

    return Response.json(profile);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});