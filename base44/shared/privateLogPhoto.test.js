import { describe, it, expect, vi } from 'npm:vitest@3.2.4';
import { resolvePrivateLogPhoto } from './privateLogPhoto.ts';
const user = { id: 'owner-a', email: 'owner@example.test', role: 'user' };
function setup(log) {
  const sign = vi.fn().mockResolvedValue({ signed_url: 'https://example.test/temporary-photo' });
  const client = { entities: { PrivateRockLog: { get: vi.fn().mockResolvedValue(log) } }, asServiceRole: { integrations: { Core: { CreateFileSignedUrl: sign } } } };
  return { client, sign };
}
describe('private photo viewing authorization', () => {
  it('requires an authenticated account and saved log id', async () => {
    const { client, sign } = setup({});
    expect((await resolvePrivateLogPhoto(client, null, 'log')).status).toBe(401);
    expect((await resolvePrivateLogPhoto(client, user, '')).status).toBe(400); expect(sign).not.toHaveBeenCalled();
  });
  it('never signs a photo belonging to a different user', async () => {
    const { client, sign } = setup({ created_by_id: 'someone-else', owner_email: 'other@example.test', image_uri: 'private://hidden' });
    expect((await resolvePrivateLogPhoto(client, user, 'log')).status).toBe(404); expect(sign).not.toHaveBeenCalled();
  });
  it('rejects a forged owner email attached to someone elses record', async () => {
    const { client, sign } = setup({ created_by_id: 'someone-else', owner_email: user.email, image_uri: 'private://hidden' });
    expect((await resolvePrivateLogPhoto(client, user, 'log')).status).toBe(404); expect(sign).not.toHaveBeenCalled();
  });
  it('returns a short-lived link without returning the underlying storage reference', async () => {
    const { client, sign } = setup({ created_by_id: user.id, owner_email: user.email, image_uri: 'private://owned' });
    const result = await resolvePrivateLogPhoto(client, user, 'log');
    expect(sign).toHaveBeenCalledWith({ file_uri: 'private://owned', expires_in: 300 });
    expect(result.status).toBe(200); expect(result).not.toHaveProperty('image_uri'); expect(result.expires_in).toBe(300);
  });
  it('preserves administrator access', async () => {
    const { client, sign } = setup({ created_by_id: 'other', owner_email: 'other@example.test', image_uri: 'private://owned' });
    expect((await resolvePrivateLogPhoto(client, { ...user, role: 'admin' }, 'log')).status).toBe(200); expect(sign).toHaveBeenCalledOnce();
  });
});