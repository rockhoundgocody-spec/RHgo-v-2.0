import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';
import { parseCoordinates } from '../../shared/geoValidation.ts';

/**
 * Privacy: fuzz exact coordinates by up to ±200m before persisting.
 * Protects rockhound-find locations from being scraped/exposed precisely.
 */
export function fuzzCoordinates(lat: number, lng: number, radiusMeters = 200) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return { lat, lng };
  const r = radiusMeters / 111320;
  const u = Math.random();
  const v = Math.random();
  const w = r * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const dLat = w * Math.cos(t);
  const dLng = (w * Math.sin(t)) / Math.cos((lat * Math.PI) / 180);
  return {
    lat: +(lat + dLat).toFixed(6),
    lng: +(lng + dLng).toFixed(6),
  };
}

/**
 * Main handler function for parseSpecimenDictation.
 */
export async function handleParseSpecimenDictation(req: Request, customBase44?: unknown): Promise<Response> {
  try {
    // deno-lint-ignore no-explicit-any
    const base44 = (customBase44 || createClientFromRequest(req)) as any;
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transcript, create = false, lat, lng } = await req.json();
    if (!transcript || typeof transcript !== 'string') {
      return Response.json({ error: 'transcript required' }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);

    const prompt = `You are extracting structured rockhounding specimen notes from a spoken dictation. Parse the transcript into the JSON schema. Use null for anything not mentioned. The found_date should be today (${today}) unless the speaker clearly states another date in YYYY-MM-DD form. Infer rarity from descriptive cues (e.g., "really rare" = rare, "amazing find" = legendary) — default to "common". Set ai_confidence to 0.6 (user-dictated, unverified).

Transcript: """${transcript}"""`;

    const fields = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          mineral_name: { type: 'string', description: 'Primary mineral name (e.g. Amethyst, Quartz)' },
          common_name: { type: ['string', 'null'], description: 'Nickname or variety' },
          found_at: { type: ['string', 'null'], description: 'Location name/description' },
          found_date: { type: ['string', 'null'], description: 'YYYY-MM-DD' },
          notes: { type: ['string', 'null'], description: 'Cleaned-up notes from the dictation' },
          rarity: { type: 'string', enum: ['common', 'uncommon', 'rare', 'legendary'] },
          ai_confidence: { type: 'number' },
        },
        required: ['mineral_name', 'rarity', 'ai_confidence'],
      },
    });

    if (!create) {
      return Response.json({ fields });
    }

    // Build payload for create — strip nulls, attach coords if provided
    const payload = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== null && v !== undefined)
    );

    const coords = parseCoordinates(lat, lng);
    if (coords) {
      const fuzzed = fuzzCoordinates(coords.lat, coords.lng, 200);
      payload.lat = fuzzed.lat;
      payload.lng = fuzzed.lng;
    }
    if (!payload.found_date) payload.found_date = today;

    if (!payload.found_at && coords) {
      const key = typeof Deno !== 'undefined' ? Deno.env.get('GOOGLE_MAPS_API_KEY') : undefined;
      if (key) {
        try {
          const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${key}`;
          const geo = await fetch(url).then((r) => r.json());
          const best = geo?.results?.[0];
          if (best?.formatted_address) payload.found_at = best.formatted_address;
        } catch {
          // non-fatal — leave found_at null
        }
      }
    }

    const created = await base44.entities.Specimen.create(payload);
    return Response.json({ fields, created });
  } catch (error) {
    console.error('parseSpecimenDictation error:', error);
    return Response.json({ error: 'Failed to parse dictation' }, { status: 500 });
  }
}
