import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Text-to-Speech proxy using Base44's built-in GenerateSpeech integration.
 * Returns base64 MP3 audio content as { audioContent: string }.
 * No external API key restrictions — works from any server context.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, voice = 'honey', rate: _rate = 0.92 } = await req.json();

    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Missing text' }, { status: 400 });
    }

    // Map legacy Google voice names to Base44 voice names
    const voiceMap = {
      'en-US-Neural2-F': 'honey',
      'en-US-Neural2-J': 'storm',
      'honey': 'honey',
      'river': 'river',
      'sunny': 'sunny',
      'storm': 'storm',
      'spark': 'spark',
    };
    const resolvedVoice = voiceMap[voice] || 'honey';

    const result = await base44.asServiceRole.integrations.Core.GenerateSpeech({
      text: text.slice(0, 800),
      voice: resolvedVoice,
      language_code: 'en',
    });

    if (!result?.url) {
      return Response.json({ error: 'No audio URL returned' }, { status: 500 });
    }

    // Fetch the MP3 and convert to base64 so the frontend can decode it the same way
    const audioRes = await fetch(result.url);
    if (!audioRes.ok) {
      return Response.json({ error: 'Failed to fetch audio' }, { status: 500 });
    }

    const buffer = await audioRes.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);

    return Response.json({ audioContent: b64 });
  } catch (error) {
    console.error('synthesizeSpeech exception:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});