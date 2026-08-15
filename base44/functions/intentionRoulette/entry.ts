import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { getNavigationStatus } from '../../shared/locationGovernance.js';

function distanceMi(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusMi = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return earthRadiusMi * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// The original roulette generated arbitrary coordinates and could direct users
// onto private or restricted land. This version randomizes only among recently
// reviewed, managed destinations and returns their verified entrance.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { lat, lng, radiusMiles = 25, intention = 'find something beautiful' } = await req.json();
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return Response.json({ error: 'lat and lng are required' }, { status: 400 });
    }

    const radius = Math.min(Math.max(Number(radiusMiles) || 25, 1), 200);
    const allHotspots = await base44.asServiceRole.entities.Hotspot.list();
    const eligible = allHotspots
      .filter((hotspot) => getNavigationStatus(hotspot).allowed)
      .map((hotspot) => ({
        hotspot,
        distance_mi: distanceMi(lat, lng, hotspot.lat, hotspot.lng),
      }))
      .filter((candidate) => candidate.distance_mi <= radius)
      .sort((a, b) => a.distance_mi - b.distance_mi)
      .slice(0, 8);

    if (eligible.length === 0) {
      return Response.json({
        error: `No reviewed destination is available within ${radius} miles.`,
        safety_note: 'RockHound-GO will not generate an unverified wildcard coordinate.',
      }, { status: 404 });
    }

    const selected = eligible[Math.floor(Math.random() * eligible.length)];
    const destination = selected.hotspot;
    const navigation = getNavigationStatus(destination);

    const message = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are Clover 🍀 Cole, the energetic, warm field companion for RockHound-GO. A rockhound set their intention: "${String(intention).slice(0, 80)}". Write a SHORT two-sentence invitation to visit the reviewed destination "${destination.name}". Do not claim that collecting is legal unless the supplied collection guidance says so. Collection guidance: "${navigation.reason}". Remind them to check the official rules before travel. Under 60 words; no markdown.`,
    });

    const safeDestination = {
      id: destination.id,
      name: destination.name,
      state: destination.state,
      lat: destination.lat,
      lng: destination.lng,
      minerals: destination.minerals || [],
      difficulty: destination.difficulty,
      publication_state: destination.publication_state,
      collection_status: destination.collection_status,
      official_source_url: destination.official_source_url,
      last_verified_at: destination.last_verified_at,
      distance_mi: Math.round(selected.distance_mi),
      collection_allowed: navigation.collectionAllowed,
    };

    return Response.json({
      // Backward-compatible field, now always the verified entrance rather than
      // an arbitrary coordinate.
      randomPoint: { lat: destination.lat, lng: destination.lng },
      nearestHotspot: safeDestination,
      reviewedDestination: safeDestination,
      intention,
      cloversMessage: message,
      safety_note: navigation.reason,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
