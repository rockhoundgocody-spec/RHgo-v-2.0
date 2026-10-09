import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/offlineQueue', () => ({ removeAccountQueue: vi.fn(), pauseAccountSync: vi.fn() }));
vi.mock('@/lib/dumpCache', () => ({ dumpAllCaches: vi.fn() }));
vi.mock('@/lib/guestDevice', () => ({ takePendingGuestReport: vi.fn() }));
import { deleteUserData } from './DeleteAccountDialog';
describe('server-confirmed account deletion', () => {
  it('continues bounded cleanup until account removal is confirmed', async () => {
    const invoke = vi.fn().mockResolvedValueOnce({ data: { complete: false, removed: 150 } }).mockResolvedValueOnce({ data: { complete: true, account_deleted: true } });
    await deleteUserData({ functions: { invoke } });
    expect(invoke).toHaveBeenCalledTimes(2);
    expect(invoke).toHaveBeenCalledWith('deleteAccount', { confirmation: 'DELETE', acknowledge_retained_uploads: true });
  });
  it('never accepts a vague response as successful account removal', async () => {
    await expect(deleteUserData({ functions: { invoke: vi.fn().mockResolvedValue({ data: { complete: true, account_deleted: false } }) } })).rejects.toThrow('not yet confirmed');
  });
  it('propagates a partial-deletion failure so the user can retry', async () => {
    const invoke = vi.fn().mockRejectedValue(new Error('Deletion paused'));
    await expect(deleteUserData({ functions: { invoke } })).rejects.toThrow('Deletion paused');
  });
});