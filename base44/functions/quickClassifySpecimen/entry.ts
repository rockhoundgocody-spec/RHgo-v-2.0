import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';
import { isValidImageUrl } from '../../shared/imageUrlValidation.ts';
import { burstCheck, cleanLiveResult, cleanRegionHint, meterLiveCall, QUALITIES } from '../../shared/liveEyes.ts';

/**
 * quickClassifySpecimen — Live Specimen Eyes.
 *
 * Takes one small frame from the live scanner (cropped to the aiming
 * square) and returns a fast, conservative preview: is a specimen in view,
 * is the shot usable, and the top few guesses with rarity and confidence.
 *
 * Input:  { file_url: string, region?: string, wet_dry?: 'wet' | 'dry' }
 * Output: { specimen_visible, quality, candidates: [{ name, rarity, confidence, x, y }], meter }
 *
 * Signed-in members only. Burst-limited per isolate and metered per day
 * (see base44/shared/liveEyes.ts). The full identification, with geology,
 * lookalikes and XP, stays in identifySpecimen.
 */

function buildPrompt(region: string, wet: boolean): string {
  return [
    'You are the live-preview eye of a rockhounding field app. You see one frame from a phone camera, cropped to the aiming square.',
    'Decide:',
    '1. specimen_visible: true only if a rock, mineral, fossil or beach stone is clearly the subject. False for people, faces, a hand with no stone, screens, rooms, pets or a blank surface.',
    '2. quality: good, blurry, dark, glare, or too_far (the specimen fills less than about a third of the frame).',
    '3. candidates: up to 3 likely identifications of the main specimen, best first.',
    '   - name: the common name a rockhound would use (for example "Lake Superior agate", "Petoskey stone", "banded jasper"). A name, not a sentence.',
    '   - rarity: common, uncommon, rare or legendary. Most beach and field stones are common; reserve legendary for truly exceptional material.',
    '   - confidence: 0 to 1, honest. This is a quick look, so stay below 0.85 unless the diagnostic features are unmistakable.',
    '   - x, y: approximate centre of the specimen, 0 to 1 from the top-left.',
    'If specimen_visible is false, return an empty candidates list.',
    region ? `The hunter is near ${region}. Treat that as a weak prior only.` : '',
    wet ? 'The stone may be wet, which deepens colour and adds shine.' : '',
  ].filter(Boolean).join('\n');
}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    specimen_visible: { type: 'boolean' },
    quality: { type: 'string', enum: [...QUALITIES] },
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          rarity: { type: 'string', enum: ['common', 'uncommon', 'rare', 'legendary'] },
          confidence: { type: 'number' },
          x: { type: 'number' },
          y: { type: 'number' },
        },
        required: ['name', 'rarity', 'confidence'],
      },
    },
  },
  required: ['specimen_visible', 'quality', 'candidates'],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) {
      return Response.json({ error: 'Sign in to use live labels', code: 'auth_required' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const fileUrl = typeof body?.file_url === 'string' ? body.file_url : '';
    if (!fileUrl) {
      return Response.json({ error: 'file_url required' }, { status: 400 });
    }
    // SSRF guard: only process images from trusted storage domains
    if (!isValidImageUrl(fileUrl)) {
      return Response.json({ error: 'file_url must be from a trusted storage domain' }, { status: 400 });
    }

    const burst = burstCheck(user.email);
    if (!burst.ok) {
      return Response.json(
        { error: 'Live labels are going too fast', code: 'live_burst', retry_after_ms: burst.retryAfterMs },
        { status: 429 },
      );
    }

    const meter = await meterLiveCall(base44 as never, user);
    if (!meter.ok) {
      return Response.json(
        { error: 'Live labels are used up for today', code: 'live_budget', meter },
        { status: 429 },
      );
    }

    const raw = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      prompt: buildPrompt(cleanRegionHint(body?.region), body?.wet_dry === 'wet'),
      file_urls: [fileUrl],
      response_json_schema: RESPONSE_SCHEMA,
    });

    return Response.json({ ...cleanLiveResult(raw), meter });
  } catch (error) {
    console.error('[quickClassifySpecimen]', error);
    return Response.json({ error: 'Live labels are unavailable right now' }, { status: 500 });
  }
});
