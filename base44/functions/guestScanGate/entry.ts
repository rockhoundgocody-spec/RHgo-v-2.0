import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { normalizeGuestId } from '../../shared/guestRateLimit.ts';

/**
 * guestScanGate — Open Beta: scans are free and unlimited for all visitors.
 * Body: { guest_device_id, action?: 'identify'|'check' }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user?.email) {
      return Response.json({ ok: true, authenticated: true });
    }

    const body = await req.json().catch(() => ({}));
    const guestId = normalizeGuestId(body?.guest_device_id) || 'g_anonymous';

    return Response.json({
      ok: true,
      guestId,
      remaining: 999,
      limit: 999,
      resetAt: null,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});