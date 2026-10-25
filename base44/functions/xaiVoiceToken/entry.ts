import { createClientFromRequest } from '@base44/sdk';

export async function handleXaiVoiceTokenRequest(
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
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const getEnv =
      opts?.envGet ||
      ((key: string) =>
        typeof Deno !== 'undefined' ? Deno.env.get(key) : (globalThis.process?.env?.[key] as string | undefined));
    const apiKey = getEnv('XAI_API_KEY');
    if (!apiKey) {
      console.error('XAI_API_KEY not configured');
      return Response.json({ error: 'Voice service configuration error' }, { status: 500 });
    }

    const fetchFn = opts?.fetchImpl || fetch;
    const res = await fetchFn('https://api.x.ai/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expires_after: { seconds: 300 } }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('xAI Voice Token request failed:', res.status, err);
      return Response.json({ error: 'Failed to mint voice session token' }, { status: res.status });
    }

    const data = await res.json();
    return Response.json({ token: data.value, expires_at: data.expires_at });
  } catch (error) {
    console.error('xaiVoiceToken error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') {
  Deno.serve((req) => handleXaiVoiceTokenRequest(req));
}
