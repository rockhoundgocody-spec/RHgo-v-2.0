import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';
import OpenAI from 'npm:openai@4.89.0';
import { enforceGuestRate } from '../../shared/guestRateLimit.ts';

/** American-accent speech, preserving the existing voice-persona preferences. */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      /* Guests can still hear Clover via TTS when the Hub is open. */
    }

    const { text, voice = 'honey', rate = 1, guest_device_id = null } = await req.json();
    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Missing text' }, { status: 400 });
    }

    if (!user?.email) {
      const gate = await enforceGuestRate(base44, guest_device_id, 'synthesizeSpeech', { consume: true });
      if (!gate.ok) {
        return Response.json(
          { error: gate.error || 'Guest rate limit exceeded', resetAt: gate.resetAt },
          { status: gate.status || 429 },
        );
      }
    }

    const personas = {
      honey: { voice: 'nova', tone: 'Warm, relaxed, friendly and conversational.' },
      river: { voice: 'sage', tone: 'Calm, thoughtful and conversational.' },
      sunny: { voice: 'coral', tone: 'Bright and friendly, without exaggeration.' },
      storm: { voice: 'onyx', tone: 'Steady, reassuring and conversational.' },
      spark: { voice: 'shimmer', tone: 'Lively and curious, without sounding theatrical.' },
    };
    const chosen = Object.hasOwn(personas, voice) ? personas[voice] : personas.honey;
    const speed = typeof rate === 'number' && Number.isFinite(rate) ? Math.min(1.5, Math.max(0.5, rate)) : 1;
    const { baseURL, token, headers } = base44.asServiceRole.aiGateway.connection();
    const client = new OpenAI({ baseURL, apiKey: token, defaultHeaders: headers, maxRetries: 0, timeout: 45000 });
    const audio = await client.audio.speech.create({
      model: 'automatic',
      input: text.slice(0, 800),
      voice: chosen.voice,
      response_format: 'mp3',
      speed,
      instructions: `Speak with a neutral General American accent and natural U.S. pronunciation, never a British or Irish accent. ${chosen.tone} You are a knowledgeable field guide speaking to one person outdoors. Use natural sentence rhythm, brief pauses and clear mineral names. Avoid an announcer voice, sing-song delivery, exaggerated emotion or artificial breathiness. Read only the supplied text.`,
    });
    const file = new File([await audio.arrayBuffer()], 'clover-speech.mp3', { type: 'audio/mpeg' });
    const { file_uri } = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });
    const { signed_url: audioUrl } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri });
    return Response.json({ audioUrl, accent: 'en-US' });
  } catch (error) {
    console.error('synthesizeSpeech exception:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}