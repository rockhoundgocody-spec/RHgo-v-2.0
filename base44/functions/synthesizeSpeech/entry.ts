import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Google Cloud Text-to-Speech proxy.
 * Returns base64 MP3 audio — high-quality Neural2 voice, 44.1 kHz sample rate.
 * Pitch is left at 0.0 (neutral) — Neural2 voices distort above ±2.0 semitones.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      text,
      voice = 'en-US-Neural2-F',
      rate = 0.92,
      pitch = 0.0,          // semitones: 0 = no pitch shift (cleanest)
    } = await req.json();

    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Missing text' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_TTS_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'GOOGLE_TTS_API_KEY not set' }, { status: 500 });
    }

    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    const body = {
      input: { text: text.slice(0, 1500) },
      voice: { languageCode: 'en-US', name: voice },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: rate,
        pitch,
        sampleRateHertz: 44100,   // up from 24 kHz — eliminates the "pixelated" artifact
        effectsProfileId: [],      // no post-processing filters that add distortion
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('TTS error:', res.status, errText);
      return Response.json({ error: `TTS failed: ${res.status}`, detail: errText }, { status: 500 });
    }

    const data = await res.json();
    return Response.json({ audioContent: data.audioContent });
  } catch (error) {
    console.error('synthesizeSpeech exception:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});