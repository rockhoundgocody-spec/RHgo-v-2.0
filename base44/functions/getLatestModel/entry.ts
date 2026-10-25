// Returns the currently active MLModel record, or null if none exists yet.
// The frontend calls this on app open / Settings refresh and caches the
// result. While null, the app falls back to the existing Gemini path.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Service role read — model registry is global, not per-user.
    const active = await base44.asServiceRole.entities.MLModel.filter(
      { is_active: true },
      '-released_at',
      1
    );

    if (active && active.length > 0) {
      return Response.json({ model: active[0] });
    }

    // Fall back to most recent if nothing is flagged active yet.
    const latest = await base44.asServiceRole.entities.MLModel.list('-released_at', 1);
    return Response.json({ model: latest?.[0] || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});