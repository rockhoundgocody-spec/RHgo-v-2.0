import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Generates a random coordinate within `radiusMiles` of a given lat/lng,
// then finds the nearest hotspot to that random point.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { lat, lng, radiusMiles = 1, intention = 'find something beautiful' } = await req.json();

    if (!lat || !lng) {
      return Response.json({ error: 'lat and lng are required' }, { status: 400 });
    }

    // Generate a random point within the radius
    const radiusDeg = radiusMiles / 69.0;
    const angle = Math.random() * 2 * Math.PI;
    const r = radiusDeg * Math.sqrt(Math.random());
    const randomLat = lat + r * Math.cos(angle);
    const randomLng = lng + r * Math.sin(angle) / Math.cos(lat * Math.PI / 180);

    // Find all hotspots and pick the nearest one to the random point
    const hotspots = await base44.asServiceRole.entities.Hotspot.list();

    let nearestHotspot = null;
    let nearestDist = Infinity;

    for (const h of hotspots) {
      if (typeof h.lat !== 'number' || typeof h.lng !== 'number') continue;
      const dLat = h.lat - randomLat;
      const dLng = h.lng - randomLng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestHotspot = h;
      }
    }

    // Use LLM to generate a Clover-voiced "intention" message
    const message = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are Clover 🍀 Cole, the energetic, warm, nature-obsessed AI companion for RockHound-GO. A rockhound just set their intention: "${intention}". Generate a SHORT (2 sentences max), enthusiastic, fun mission briefing for them. Reference the intention. End with a single action like "Go find it!" or "The rocks are calling!" Keep it under 60 words. No markdown.`,
    });

    return Response.json({
      randomPoint: { lat: randomLat, lng: randomLng },
      nearestHotspot: nearestHotspot || null,
      intention,
      cloversMessage: message,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});