import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * DIT.ai vision-based mineral classification using Gemini 3 Pro.
 * Higher accuracy than the live-frame quickClassify; use for deep-scan.
 *
 * Payload: { image_url: string, hint?: string }
 * Returns: { primary, candidates: [{name, confidence, reason}], properties }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get('All_in_1_KEY');
    if (!apiKey) {
      return Response.json({ error: 'All_in_1_KEY not set' }, { status: 500 });
    }

    const { image_url, hint } = await req.json();
    if (!image_url) {
      return Response.json({ error: 'image_url required' }, { status: 400 });
    }

    // Fetch the image and convert to inline base64 for Gemini
    const imgRes = await fetch(image_url);
    if (!imgRes.ok) {
      return Response.json({ error: 'failed to fetch image' }, { status: 400 });
    }
    const mime = imgRes.headers.get('content-type') || 'image/jpeg';
    const buf = new Uint8Array(await imgRes.arrayBuffer());
    let bin = '';
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    const b64 = btoa(bin);

    const instruction = `You are an expert field geologist. Identify the mineral or rock in this image. ${
      hint ? `User hint: "${hint}". ` : ''
    }Respond ONLY with valid JSON matching this exact shape:
{
  "primary": { "name": string, "confidence": number, "rarity": "common"|"uncommon"|"rare"|"legendary" },
  "candidates": [{ "name": string, "confidence": number, "reason": string }],
  "properties": { "color": string, "luster": string, "hardness": string, "crystal_system": string }
}
No prose, no markdown — JSON only.`;

    const res = await fetch(
      'https://api.dit.ai/v1beta/models/gemini-3-pro-preview:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: instruction },
                { inline_data: { mime_type: mime, data: b64 } },
              ],
            },
          ],
          generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return Response.json(
        { error: data?.error?.message || 'DIT vision request failed', details: data },
        { status: res.status }
      );
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Strip markdown fences if the model added them despite instructions
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return Response.json({ error: 'model returned non-JSON', raw: text }, { status: 502 });
    }

    return Response.json(parsed);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});