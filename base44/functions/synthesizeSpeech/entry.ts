import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { enforceGuestRate } from '../../shared/guestRateLimit.ts';

/**
 * Text-to-Speech for Clover using Base44's built-in GenerateSpeech integration.
 * Returns { audioUrl } — an MP3 URL the frontend loads into the Web Audio pipeline.
 * Voices: river (calm), honey (warm/soft — Clover's default), sunny, storm, spark.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      /* Guests can still hear Clover via TTS when the Hub is open. */
    }

    const { text, voice = 'honey', guest_device_id = null } = await req.json();
    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Missing text' }, { status: 400 });
    }

    // Open Beta: Clover voice synthesis is free and unlimited for all explorers.
    void guest_device_id;
    void enforceGuestRate;

    const allowed = ['river', 'honey', 'sunny', 'storm', 'spark'];
    const chosen = allowed.includes(voice) ? voice : 'honey';

    const cleanSpeechText = text
      .replace(/[*_`~#]+/g, '')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
      .replace(/SiO₂/g, 'silica')
      .replace(/CaCO₃/g, 'calcium carbonate')
      .replace(/FeS₂/g, 'iron sulfide')
      .replace(/\bMohs\b/g, 'Moze')
      .replace(/\bdruzy\b/gi, 'droozy')
      .replace(/\s*[—–]\s*/g, ', ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 800);

    const result = await base44.integrations.Core.GenerateSpeech({
      text: cleanSpeechText || text.slice(0, 800),
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
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});