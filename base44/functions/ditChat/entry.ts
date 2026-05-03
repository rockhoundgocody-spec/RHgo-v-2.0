import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * DIT.ai chat completion gateway.
 * Default model: claude-opus-4-7 (best reasoning for the Oracle).
 *
 * Payload: {
 *   messages: [{ role: 'system'|'user'|'assistant', content: string }],
 *   model?: string,           // default: 'claude-opus-4-7'
 *   max_tokens?: number,      // default: 400
 *   temperature?: number      // default: 0.7
 * }
 * Returns: { content: string, model: string, usage: {...} }
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

    const {
      messages,
      model = 'claude-opus-4-7',
      max_tokens = 400,
      temperature = 0.7,
    } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'messages array required' }, { status: 400 });
    }

    const res = await fetch('https://api.dit.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens, temperature, stream: false }),
    });

    const data = await res.json();
    if (!res.ok) {
      return Response.json(
        { error: data?.error?.message || 'DIT request failed', details: data },
        { status: res.status }
      );
    }

    return Response.json({
      content: data?.choices?.[0]?.message?.content || '',
      model: data?.model || model,
      usage: data?.usage || null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});