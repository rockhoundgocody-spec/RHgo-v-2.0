import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { safeError } from '../../shared/httpErrors.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // The model catalog is an operator/debug surface — exposing it to any
    // signed-in user leaks the third-party provider's available models and
    // protocols. Gate behind admin so only operators can introspect it.
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const apiKey = Deno.env.get('All_in_1_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Service configuration error' }, { status: 500 });
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
    return safeError('ditModels', error);
  }
});