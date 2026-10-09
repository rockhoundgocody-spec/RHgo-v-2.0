import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';

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
export async function handleDitChatRequest(
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

    const {
      messages,
      model = 'claude-opus-4-7',
      max_tokens = 400,
      temperature = 0.7,
    } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'messages array required' }, { status: 400 });
    }

    const fetchFn = opts?.fetchImpl || fetch;
    const res = await fetchFn('https://api.dit.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens, temperature, stream: false }),
    });

    const data = await res.json();
    if (!res.ok) {
      // Log third-party payload details server-side; do not pass raw details to client
      console.error('DIT Chat request failed:', res.status, data);
      return Response.json(
        { error: 'DIT request failed' },
        { status: res.status }
      );
    }

    return Response.json({
      content: data?.choices?.[0]?.message?.content || '',
      model: data?.model || model,
      usage: data?.usage || null,
    });
  } catch (error) {
    // Log exception details server-side; sanitize error message returned to caller
    console.error('ditChat error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') {
  Deno.serve((req) => handleDitChatRequest(req));
}
