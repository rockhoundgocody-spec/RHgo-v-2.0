import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * Text-to-Speech for Clover using Base44's built-in GenerateSpeech integration.
 * Returns { audioUrl } — an MP3 URL the frontend loads into the Web Audio pipeline.
 * Voices: river (calm), honey (warm/soft — Clover's default), sunny, storm, spark.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    try {
      await base44.auth.me();
    } catch {
      /* Guests can still hear Clover via TTS when the Hub is open. */
    }

    const { text, voice = 'honey' } = await req.json();
    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Missing text' }, { status: 400 });
    }

    const allowed = ['river', 'honey', 'sunny', 'storm', 'spark'];
    const chosen = allowed.includes(voice) ? voice : 'honey';

    const result = await base44.integrations.Core.GenerateSpeech({
      text: text.slice(0, 800),
      voice: chosen,
      language_code: 'en',
    });

    const audioUrl = result?.url || result?.data?.url;
    if (!audioUrl) {
      console.error('GenerateSpeech returned no url:', JSON.stringify(result));
      return Response.json({ error: 'No audio returned' }, { status: 502 });
    }

    return Response.json({ audioUrl });
  } catch (error) {
    console.error('synthesizeSpeech exception:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});