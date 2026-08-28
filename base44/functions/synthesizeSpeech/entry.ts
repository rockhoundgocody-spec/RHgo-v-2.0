import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

/**
 * Text-to-Speech proxy using Google Cloud TTS.
 * Clover's default voice (honey) is an educated Irish-English female
 * (en-IE-Wavenet-A) — warm, articulate, and distinctly not British.
 * Returns base64 MP3 as { audioContent } for the frontend Web Audio pipeline.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { text, voice = 'honey', rate = 0.95, pitch = 1.0 } = await req.json();
    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Missing text' }, { status: 400 });
    }

    // Persona → Google Cloud TTS voice. Default is Clover's signature Irish female.
    const voiceMap = {
      honey: 'en-IE-Wavenet-A',  // Irish female, warm & educated — Clover's voice
      river: 'en-US-Wavenet-F',  // American female, conversational
      sunny: 'en-US-Wavenet-G',  // American female, bright
      storm: 'en-US-Wavenet-H',  // American female, steady
      spark: 'en-US-Wavenet-E',  // American female, lively
    };
    const voiceName = voiceMap[voice] || voiceMap.honey;
    const languageCode = voiceName.startsWith('en-IE') ? 'en-IE' : 'en-US';

    // Frontend pitch is a multiplier (0.8–1.5, 1.0 = neutral). Google expects
    // semitones relative to the default pitch (-20..+20).
    const googlePitch = Math.max(-20, Math.min(20, ((pitch || 1.0) - 1.0) * 20));

    const apiKey = secrets.get('GOOGLE_TTS_API_KEY');
    if (!apiKey) return Response.json({ error: 'TTS key not configured' }, { status: 500 });

    // The TTS API key is HTTP-referer restricted; the backend has no natural
    // Referer, so send the app's origin to satisfy the restriction.
    const ttsRes = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://rhgo.base44.app/',
        },
        body: JSON.stringify({
          input: { text: text.slice(0, 800) },
          voice: { languageCode, name: voiceName, ssmlGender: 'FEMALE' },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: Math.max(0.25, Math.min(4.0, rate || 0.95)),
            pitch: googlePitch,
          },
        }),
      }
    );

    if (!ttsRes.ok) {
      const errDetail = await ttsRes.text();
      console.error('Google TTS error:', errDetail);
      return Response.json({ error: 'TTS synthesis failed', detail: errDetail }, { status: 502 });
    }

    const data = await ttsRes.json();
    if (!data.audioContent) {
      return Response.json({ error: 'No audio content returned' }, { status: 502 });
    }

    return Response.json({ audioContent: data.audioContent });
  } catch (error) {
    console.error('synthesizeSpeech exception:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});