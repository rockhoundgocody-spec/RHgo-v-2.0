import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';
import { isValidImageUrl } from '../../shared/imageUrlValidation.ts';

/**
 * DIT.ai vision-based mineral classification using Gemini 3 Pro.
 * Higher accuracy than the live-frame quickClassify; use for deep-scan.
 *
 * Payload: { image_url: string, hint?: string }
 * Returns: { primary, candidates: [{name, confidence, reason}], properties }
 */
export async function handleDitClassifyRequest(
  req: Request,
  opts?: {
    createClientFromRequest?: typeof createClientFromRequest;
    envGet?: (key: string) => string | undefined;
    fetchImpl?: typeof fetch;
  }
): Promise<Response> {
  try {
    const clientFactory = opts?.createClientFromRequest || createClientFromRequest;
    const base44 = clientFactory(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const getEnv =
      opts?.envGet ||
      ((key: string) =>
        typeof Deno !== 'undefined'
          ? Deno.env.get(key)
          : (globalThis.process?.env?.[key] as string | undefined));
    const apiKey = getEnv('All_in_1_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Service configuration error' }, { status: 500 });
    }

    const { image_url, hint } = await req.json();
    if (!image_url) {
      return Response.json({ error: 'image_url required' }, { status: 400 });
    }

    // SSRF guard: only fetch images from trusted storage domains
    if (!isValidImageUrl(image_url)) {
      return Response.json({ error: 'image_url must be from a trusted storage domain' }, { status: 400 });
    }

    const fetchFn = opts?.fetchImpl || fetch;

    // Fetch the image and convert to inline base64 for Gemini
    const imgRes = await fetchFn(image_url);
    if (!imgRes.ok) {
      return Response.json({ error: 'failed to fetch image' }, { status: 400 });
    }
    const mime = imgRes.headers.get('content-type') || 'image/jpeg';
    const buf = new Uint8Array(await imgRes.arrayBuffer());
    let b64 = '';
    if (typeof Buffer !== 'undefined') {
      b64 = Buffer.from(buf).toString('base64');
    } else {
      let bin = '';
      for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
      b64 = btoa(bin);
    }

    const instruction = `You are an expert field geologist. Identify the mineral or rock in this image. ${
      hint ? `User hint: "${hint}". ` : ''
    }Respond ONLY with valid JSON matching this exact shape:
{
  "primary": { "name": string, "confidence": number, "rarity": "common"|"uncommon"|"rare"|"legendary" },
  "candidates": [{ "name": string, "confidence": number, "reason": string }],
  "properties": { "color": string, "luster": string, "hardness": string, "crystal_system": string }
}
No prose, no markdown — JSON only.`;

    const res = await fetchFn(
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
      // Log third-party payload details server-side; do not pass raw details to client
      console.error('DIT Vision request failed:', res.status, data);
      return Response.json(
        { error: 'DIT vision request failed' },
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
      // Log unparsed output server-side; sanitize error returned to caller
      console.error('ditClassify model returned non-JSON:', text);
      return Response.json({ error: 'Invalid response from model' }, { status: 502 });
    }

    return Response.json(parsed);
  } catch (error) {
    // Log exception details server-side; sanitize error message returned to caller
    console.error('ditClassify error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') {
  Deno.serve((req) => handleDitClassifyRequest(req));
}
