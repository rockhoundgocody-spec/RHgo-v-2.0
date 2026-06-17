import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Mints a short-lived xAI Realtime session token for browser clients.
 * The raw XAI_API_KEY never leaves the server.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get('XAI_API_KEY');
    if (!apiKey) return Response.json({ error: 'XAI_API_KEY not configured' }, { status: 500 });

    const res = await fetch('https://api.x.ai/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expires_after: { seconds: 300 } }),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return Response.json({ token: data.value, expires_at: data.expires_at });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});