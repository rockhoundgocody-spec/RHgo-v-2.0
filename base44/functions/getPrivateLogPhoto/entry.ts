import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { resolvePrivateLogPhoto } from '../../shared/privateLogPhoto.ts';
export default async function(req) {
  try {
    const client = createClientFromRequest(req);
    const user = await client.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Sign in to view this photo.' }, { status: 401 });
    const body = await req.json();
    const result = await resolvePrivateLogPhoto(client, user, body.log_id);
    const { status, ...data } = result;
    return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Private photo access failed', error.message);
    return Response.json({ error: 'Photo access is temporarily unavailable.' }, { status: 500 });
  }
}