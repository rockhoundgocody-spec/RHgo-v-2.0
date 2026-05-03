import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

    const res = await fetch('https://api.dit.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const body = await res.text();
    let data;
    try { data = JSON.parse(body); } catch { data = body; }

    return Response.json({
      ok: res.ok,
      status: res.status,
      models: data?.data?.map((m) => ({
        id: m.id,
        owned_by: m.owned_by,
        status: m.status,
        protocols: m.supported_protocols,
      })) || data,
    }, { status: res.ok ? 200 : res.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});