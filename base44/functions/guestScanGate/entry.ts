import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { enforceGuestRate } from '../../shared/guestRateLimit.ts';

/**
 * guestScanGate — must succeed before a guest InvokeLLM / identify.
 * Body: { guest_device_id, action?: 'identify'|'check' }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Authenticated users do not need this gate.
    const user = await base44.auth.me().catch(() => null);
    if (user?.email) {
      return Response.json({ ok: true, authenticated: true });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action === 'check' ? 'check' : 'identify';
    const result = await enforceGuestRate(
      base44 as never,
      body?.guest_device_id,
      'identify',
      { consume: action !== 'check' },
    );

    if (!result.ok) {
      return Response.json(
        { error: result.error, resetAt: result.resetAt, remaining: result.remaining },
        { status: result.status || 429 },
      );
    }
    return Response.json({
      ok: true,
      guestId: result.guestId,
      remaining: result.remaining,
      limit: result.limit,
      resetAt: result.resetAt,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
