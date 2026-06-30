import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { lat, lng, season } = body;

    // Load the user's existing specimens to find collection gaps
    const specimens = await base44.entities.Specimen.filter({ created_by_id: user.id }, '-created_date', 50);
    const collectedMinerals = [...new Set(specimens.map((s) => s.mineral_name).filter(Boolean))];
    const rarityCounts = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
    specimens.forEach((s) => { if (s.rarity) rarityCounts[s.rarity] = (rarityCounts[s.rarity] || 0) + 1; });

    // Build context for the AI
    const locationCtx = lat && lng ? `User is near coordinates ${lat.toFixed(3)}, ${lng.toFixed(3)}.` : 'Location unknown.';
    const seasonCtx = season ? `Current season: ${season}.` : `Current month: ${new Date().toLocaleString('default', { month: 'long' })}.`;
    const collectionCtx = collectedMinerals.length
      ? `User has collected: ${collectedMinerals.slice(0, 15).join(', ')}.`
      : 'User has no specimens yet — they are a beginner.';
    const rarityCtx = `Rarity breakdown: common=${rarityCounts.common}, uncommon=${rarityCounts.uncommon}, rare=${rarityCounts.rare}, legendary=${rarityCounts.legendary}.`;

    const prompt = `You are RockHound-GO's Field Mission AI. Generate exactly 3 personalized rockhounding missions for a user.

Context:
- ${locationCtx}
- ${seasonCtx}
- ${collectionCtx}
- ${rarityCtx}

Rules:
1. Mix quest types: at least one "daily", one "weekly". Can add one "monthly" if the user is experienced.
2. Tailor missions to what the user is MISSING from their collection. If they have no rare/legendary, suggest a mission hunting one.
3. Each mission should feel achievable but slightly challenging.
4. Use authentic rockhounding terminology — streak test, luster, cleavage, etc.
5. Clover messages should sound like an encouraging field companion, concise, 1-2 sentences.
6. XP rewards: daily 50-150, weekly 150-350, monthly 400-700.
7. target_rarity should only be "rare" or "legendary" for special missions, otherwise omit.

Return exactly 3 missions as JSON array.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          missions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                quest_type: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
                target_count: { type: 'integer' },
                xp_reward: { type: 'integer' },
                target_rarity: { type: 'string' },
                target_mineral: { type: 'string' },
                clover_message: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const missions = result?.missions || [];

    // Save the missions to the Quest entity
    function getExpiry(type) {
      const d = new Date();
      if (type === 'daily') d.setHours(d.getHours() + 24);
      else if (type === 'weekly') d.setDate(d.getDate() + 7);
      else d.setDate(d.getDate() + 30);
      return d.toISOString();
    }

    const created = await Promise.all(missions.map((m) =>
      base44.entities.Quest.create({
        owner_email: user.email,
        title: m.title,
        description: m.description,
        quest_type: m.quest_type || 'daily',
        target_count: m.target_count || 1,
        xp_reward: m.xp_reward || 100,
        target_rarity: m.target_rarity || null,
        target_mineral: m.target_mineral || null,
        clover_message: m.clover_message || '',
        status: 'active',
        progress: 0,
        expires_at: getExpiry(m.quest_type || 'daily'),
      })
    ));

    return Response.json({ missions: created, count: created.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});