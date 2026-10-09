export async function resolvePrivateLogPhoto(client, user, id) {
  if (!user?.id || !user?.email) return { status: 401, error: 'Sign in to view this photo.' };
  if (typeof id !== 'string' || !id.trim()) return { status: 400, error: 'A saved log is required.' };
  let log;
  try { log = await client.entities.PrivateRockLog.get(id); }
  catch (error) {
    if ([403, 404].includes(error?.status ?? error?.response?.status)) return { status: 404, error: 'Photo not found.' };
    throw error;
  }
  if (!log || (user.role !== 'admin' && (log.owner_email !== user.email || log.created_by_id !== user.id))) return { status: 404, error: 'Photo not found.' };
  if (!log.image_uri) return { status: 404, error: 'No private photo is saved for this log.' };
  const signed = await client.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: log.image_uri, expires_in: 300 });
  if (!signed?.signed_url) throw new Error('Photo access is temporarily unavailable.');
  return { status: 200, signed_url: signed.signed_url, expires_in: 300 };
}