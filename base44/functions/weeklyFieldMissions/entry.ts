/**
 * weeklyFieldMissions — runs every Sunday via workflow.
 *
 * For every user:
 *   1. hotspot_manager logic — query Hotspots, filter to nearby unvisited zones
 *      (zones whose minerals the user hasn't collected yet)
 *   2. generateFieldMissions logic — InvokeLLM to create 3 Quests tailored to
 *      their missing collection types + the unvisited zones found above
 *   3. SendPushNotification — notify the user's device
 *
 * No user context (scheduled trigger) — all operations use asServiceRole.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function getExpiry(type: string): string {
  const d = new Date();
  if (type === 'daily') d.setHours(d.getHours() + 24);
  else if (type === 'weekly') d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + 30);
  return d.toISOString();
}

function getSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // ── 1. List all users ──
    const users = await base44.asServiceRole.entities.User.list('-created_date', 500);

    let processed = 0;
    let notified = 0;
    let skipped = 0;
    let errored = 0;

    for (const user of users) {
      try {
        // ── 2. Load user's specimens → collection gaps + approximate location ──
        const specimens = await base44.asServiceRole.entities.Specimen.filter(
          { created_by_id: user.id },
          '-created_date',
          50,
        );
        const collectedMinerals = [...new Set(specimens.map((s) => s.mineral_name).filter(Boolean))];
        const collectedSet = new Set(collectedMinerals.map((m) => m.toLowerCase()));

        // Approximate user location from most recent specimen with coords
        const lastWithCoords = specimens.find((s) => s.lat != null && s.lng != null);
        const userLat = lastWithCoords?.lat;
        const userLng = lastWithCoords?.lng;

        // ── 3. hotspot_manager logic: find nearby unvisited zones ──
        const hotspots = await base44.asServiceRole.entities.Hotspot.list('-trust_score', 200);

        // Unvisited = hotspot has at least one mineral the user hasn't collected
        const unvisitedHotspots = hotspots.filter((h) => {
          if (!h.minerals || h.minerals.length === 0) return false;
          return h.minerals.some((m) => !collectedSet.has(m.toLowerCase()));
        });

        // Sort by distance if we have a user location
        let unvisited = unvisitedHotspots.map((h) => ({
          ...h,
          _dist: (userLat != null && userLng != null && h.lat != null && h.lng != null)
            ? Math.hypot(h.lat - userLat, h.lng - userLng)
            : 999,
        }));

        if (userLat != null && userLng != null) {
          unvisited.sort((a, b) => a._dist - b._dist);
        }

        const topUnvisited = unvisited.slice(0, 8);

        // Skip users with no unvisited zones and no specimens (nothing to tailor)
        if (topUnvisited.length === 0 && collectedMinerals.length === 0) {
          skipped++;
          continue;
        }

        // ── 4. generateFieldMissions logic: create 3 tailored Quests ──
        const locationCtx = userLat != null
          ? `User is near coordinates ${userLat.toFixed(3)}, ${userLng.toFixed(3)}.`
          : 'Location unknown.';
        const seasonCtx = `Current season: ${getSeason()}.`;
        const collectionCtx = collectedMinerals.length
          ? `User has collected: ${collectedMinerals.slice(0, 15).join(', ')}.`
          : 'User has no specimens yet — they are a beginner.';
        const unvisitedCtx = topUnvisited.length > 0
          ? `Nearby unvisited zones with minerals they haven't found: ${topUnvisited
              .slice(0, 5)
              .map(
                (h) =>
                  `${h.name} in ${h.state || 'unknown'} — minerals: ${(h.minerals || []).join(', ')} — land: ${h.land_type || 'unknown'}, access: ${h.access_status || 'unknown'}`,
              )
              .join('; ')}.`
          : 'No specific unvisited zones identified — suggest general exploration.';

        const prompt = `You are RockHound-GO's Field Mission AI. Generate exactly 3 personalized rockhounding missions for a user.

Context:
- ${locationCtx}
- ${seasonCtx}
- ${collectionCtx}
- ${unvisitedCtx}

Rules:
1. Mix quest types: at least one "daily", one "weekly". Can add one "monthly" if the user is experienced.
2. Tailor missions to what the user is MISSING from their collection, using the nearby unvisited zones.
3. Each mission should feel achievable but slightly challenging.
4. Use authentic rockhounding terminology — streak test, luster, cleavage, etc.
5. Clover messages should sound like an encouraging field companion, concise, 1-2 sentences.
6. XP rewards: daily 50-150, weekly 150-350, monthly 400-700.
7. target_rarity should only be "rare" or "legendary" for special missions, otherwise omit.
8. Reference specific nearby unvisited zones by name when possible.

Return exactly 3 missions as JSON.`;

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

        // ── 5. Create Quest records ──
        for (const m of missions) {
          await base44.asServiceRole.entities.Quest.create({
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
          });
        }

        // ── 6. Push notification to device ──
        if (missions.length > 0) {
          try {
            await base44.asServiceRole.integrations.Core.SendPushNotification({
              user_id: user.id,
              title: '3 new field missions await',
              content:
                missions[0]?.clover_message ||
                `Clover found ${missions.length} new hunts near you. Tap to see what's nearby.`,
              action_label: 'View missions',
              action_url: '/quests',
            });
            notified++;
          } catch (pushErr) {
            // Push fails if user has no native device registered — log and continue
            console.log(`Push failed for ${user.email}: ${pushErr.message}`);
          }
        }

        processed++;
      } catch (userErr) {
        console.log(`Failed for ${user.email}: ${userErr.message}`);
        errored++;
      }
    }

    return Response.json({
      status: 'ok',
      total: users.length,
      processed,
      notified,
      skipped,
      errored,
    });
  } catch (error) {
    console.error('weeklyFieldMissions fatal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
