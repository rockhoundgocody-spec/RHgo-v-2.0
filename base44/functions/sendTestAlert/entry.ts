import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { sendPushToEmail } from '../../shared/webPush.ts';

/**
 * sendTestAlert — sends one alert to the caller's own devices.
 *
 * The recipient is always resolved from the authenticated user, never from the
 * payload, so this endpoint can never be used to alert someone else.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await sendPushToEmail(base44, user.email, {
      title: 'RockHound GO alerts are on',
      body: 'This is a test alert. Field alerts will land here when the app is closed.',
      url: '/',
      tag: 'rhgo-test-alert',
    });

    return Response.json({ ...result, configured: !result.skipped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});