import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { getNavigationStatus } from '../../shared/locationGovernance.js';

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
    const specimens = await base44.entities.Specimen.list('-found_date', 200);
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

    // 2. Only reviewed collecting destinations with a current official source
    // may enter a hunt recommendation. Service-role reads must re-apply the
    // same fail-closed policy used by the public map.
    const allHotspots = await base44.asServiceRole.entities.Hotspot.list('-updated_date', 100);
    const hotspots = allHotspots.filter((h) => {
      const status = getNavigationStatus(h);
      return status.allowed && status.collectionAllowed;
    });
    let scored = hotspots.map(h => ({
      name: h.name,
      state: h.state,
      lat: h.lat,
      lng: h.lng,
      minerals: h.minerals || [],
      difficulty: h.difficulty,
      collection_status: h.collection_status,
      official_source_url: h.official_source_url,
      last_verified_at: h.last_verified_at,
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
- Never name a location outside NEARBY HOTSPOTS and never infer access from land ownership.
- Tell the user to open the official rules before travel; conditions can change after review.
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

    const allowedByName = new Map(nearby.map((h) => [h.name.toLowerCase(), h]));
    const suggestions = (Array.isArray(parsed?.suggestions) ? parsed.suggestions : [])
      .slice(0, 4)
      .map((suggestion) => {
        const safeHotspot = allowedByName.get(String(suggestion?.hotspot_name || '').toLowerCase());
        if (!safeHotspot) return null;
        return {
          ...suggestion,
          hotspot_name: safeHotspot.name,
          distance_mi: safeHotspot.distanceMi ?? null,
          official_source_url: safeHotspot.official_source_url,
          rules_reviewed_at: safeHotspot.last_verified_at,
        };
      })
      .filter(Boolean);

    return Response.json({
      clover_intro: String(parsed?.clover_intro || `Hey ${name}, here's what I'd hunt next.`).trim(),
      suggestions,
      collection_size: specimens.length,
      nearby_hotspot_count: nearby.length,
      safety_note: 'Use the official rules link before travel. Access and collecting conditions can change.',
    });
  } catch (error) {
    console.error('suggestNextFinds error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
