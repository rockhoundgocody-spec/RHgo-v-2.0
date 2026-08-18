import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Haversine distance in miles
function distanceMi(lat1, lng1, lat2, lng2) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { lat, lng } = await req.json().catch(() => ({}));
    const name = (user.full_name?.split(' ')[0] || 'explorer').slice(0, 40);

    // 1. User's collection profile — group specimen counts by mineral name
    const specimens = await base44.entities.Specimen.list('-found_date', 200, 0, ['mineral_name']);
    const collection = {};
    for (const s of specimens) {
      const m = (s.mineral_name || '').trim();
      if (!m) continue;
      collection[m] = (collection[m] || 0) + 1;
    }
    const collectedNames = Object.keys(collection);
    const collectedSummary = collectedNames.length
      ? collectedNames.map(m => `${m} (${collection[m]})`).join(', ')
      : 'No specimens logged yet.';

    // 2. Nearby hotspots — public read, sort by distance if geo available
    const hotspots = await base44.asServiceRole.entities.Hotspot.list('-updated_date', 100);
    let scored = hotspots.map(h => ({
      name: h.name,
      state: h.state,
      lat: h.lat,
      lng: h.lng,
      minerals: h.minerals || [],
      difficulty: h.difficulty,
      trust_score: h.trust_score,
      land_type: h.land_type,
      distanceMi: (lat != null && h.lat != null) ? Math.round(distanceMi(lat, lng, h.lat, h.lng)) : null,
    }));
    if (lat != null) {
      scored.sort((a, b) => (a.distanceMi ?? 9999) - (b.distanceMi ?? 9999));
    }
    const nearby = scored.slice(0, 8);

    // 3. Minerals available nearby that the user has NOT collected yet
    const nearbyMinerals = new Set();
    for (const h of nearby) {
      for (const m of h.minerals) nearbyMinerals.add(m);
    }
    const uncollectedNearby = [...nearbyMinerals].filter(m => !collection[m]);

    const hotspotContext = nearby.map(h =>
      `${h.name}${h.state ? ', ' + h.state : ''}` +
      (h.distanceMi != null ? ` (${h.distanceMi}mi)` : '') +
      ` — minerals: ${(h.minerals || []).slice(0, 8).join(', ') || 'unspecified'}` +
      ` — difficulty: ${h.difficulty || 'moderate'}`
    ).join('\n');

    // 4. LLM — suggest specific minerals to hunt next
    const prompt = `You are Clover 🍀, a rockhounding field companion. Generate a personalized "hunt next" suggestion for ${name}.

THEIR COLLECTION SO FAR:
${collectedSummary}

NEARBY HOTSPOTS (closest first):
${hotspotContext || 'No mapped hotspots nearby — suggest based on general Michigan / Great Lakes geology.'}

MINERALS AVAILABLE NEARBY THEY HAVEN'T FOUND YET:
${uncollectedNearby.length ? uncollectedNearby.join(', ') : 'Cross-reference collection gaps with hotspot minerals.'}

Rules:
- Suggest exactly 3 specific minerals to hunt next.
- Prioritize minerals that (a) they do NOT already have and (b) are available at nearby hotspots.
- For each, name the best nearby hotspot, what to look for, and why it's a good next target.
- If no geolocation was given, still suggest based on collection gaps + general Midwest geology.
- Be accurate — only reference minerals that genuinely occur at the named hotspots.
- Keep each suggestion's "why" to one sentence.

Output a JSON object:
{
  "clover_intro": "1-2 sentence warm intro in Clover's voice, addressing ${name} by first name",
  "suggestions": [
    {
      "mineral_name": "string",
      "hotspot_name": "string or null",
      "distance_mi": "number or null",
      "difficulty": "easy|moderate|hard|expert",
      "what_to_look_for": "1 short sentence",
      "why": "1 sentence why this is a good next target"
    }
  ]
}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          clover_intro: { type: 'string' },
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                mineral_name: { type: 'string' },
                hotspot_name: { type: 'string' },
                distance_mi: { type: 'number' },
                difficulty: { type: 'string' },
                what_to_look_for: { type: 'string' },
                why: { type: 'string' },
              },
            },
          },
        },
      },
    });

    let parsed = result;
    if (typeof result === 'string') {
      try {
        parsed = JSON.parse(result.replace(/```json|```/g, '').trim());
      } catch {
        parsed = { clover_intro: `Hey ${name}, let me think about what's next…`, suggestions: [] };
      }
    }

    return Response.json({
      clover_intro: String(parsed?.clover_intro || `Hey ${name}, here's what I'd hunt next.`).trim(),
      suggestions: Array.isArray(parsed?.suggestions) ? parsed.suggestions.slice(0, 4) : [],
      collection_size: specimens.length,
      nearby_hotspot_count: nearby.length,
    });
  } catch (error) {
    console.error('suggestNextFinds error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});