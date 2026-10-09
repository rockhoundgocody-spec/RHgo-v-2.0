import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
const mocks = vi.hoisted(() => ({ me: vi.fn(), create: vi.fn(), update: vi.fn(), filter: vi.fn() }));
vi.mock('@/api/base44Client', () => ({ base44: { auth: { me: mocks.me }, entities: { PrivateRockLog: { create: mocks.create, update: mocks.update, filter: mocks.filter } } } }));
import { queueWrite, loadQueue, saveQueue, flushQueue, getQueueLength, belongsToUser } from '@/lib/offlineQueue';
const user = { id: 'test-owner', email: 'owner@example.test' };
const key = 'rh-offline-queue-v1';
const makeItem = (extra = {}) => ({ entity: 'PrivateRockLog', op: 'create', ownerId: user.id, queueId: 'pending-1', data: { owner_email: user.email, mineral_name: 'Quartz', offline_write_id: 'pending-1' }, ...extra });
let store;
beforeEach(() => {
  vi.clearAllMocks(); store = new Map();
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('window', undefined);
  vi.stubGlobal('navigator', { onLine: true });
  vi.stubGlobal('localStorage', { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) });
  mocks.me.mockResolvedValue(user); mocks.filter.mockResolvedValue([]); mocks.create.mockResolvedValue({ id: 'saved-pin' });
});
afterEach(() => vi.unstubAllGlobals());
describe('durable owner-scoped offline finds', () => {
  it('encrypts pins before attempting a network write', async () => {
    mocks.create.mockImplementation(() => { expect(store.get(key)).not.toContain('Quartz'); throw new TypeError('Network failed'); });
    expect(await queueWrite({ entity: 'PrivateRockLog', ownerId: user.id, data: { owner_email: user.email, mineral_name: 'Quartz' } })).toEqual({ ok: true, offline: true });
    expect((await loadQueue())[0].data.mineral_name).toBe('Quartz');
  });
  it('never trims older pins when storage is full', async () => {
    const original = Array.from({ length: 8 }, (_, n) => makeItem({ queueId: `pin-${n}` }));
    await saveQueue(original); const before = store.get(key);
    localStorage.setItem = () => { throw new Error('Quota'); };
    await expect(saveQueue([...original, makeItem()])).rejects.toThrow('not saved');
    expect(store.get(key)).toBe(before); expect(getQueueLength(user)).toBe(8);
  });
  it('reports failure rather than pretending an unpersisted pin was saved', async () => {
    navigator.onLine = false;
    localStorage.setItem = () => { throw new Error('Quota'); };
    await expect(queueWrite({ entity: 'PrivateRockLog', ownerId: user.id, data: { owner_email: user.email, mineral_name: 'Quartz' } })).rejects.toThrow();
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('preserves corrupt data and refuses to overwrite it', async () => {
    store.set(key, 'corrupt');
    await expect(queueWrite({ entity: 'PrivateRockLog', ownerId: user.id, data: { owner_email: user.email, mineral_name: 'Quartz' } })).rejects.toThrow('left untouched');
    expect(store.get(key)).toBe('corrupt');
  });
  it('does not replace the key when encrypted data cannot be unlocked', async () => {
    await saveQueue([makeItem()]); const before = store.get(key); store.delete('rh-offline-queue-key-v1');
    await expect(loadQueue()).rejects.toThrow('key is missing'); expect(store.get(key)).toBe(before);
  });
  it('encrypts legacy rows without dropping their content', async () => {
    store.set(key, JSON.stringify([makeItem()]));
    const items = await loadQueue();
    expect(items[0].data.mineral_name).toBe('Quartz');
    await saveQueue(items); expect(store.get(key)).not.toContain('Quartz');
  });
  it('never replays another account or unattributed legacy finds', async () => {
    await saveQueue([makeItem({ ownerId: 'other-owner' }), { ...makeItem(), ownerId: undefined, data: { mineral_name: 'Legacy' } }]);
    expect((await flushQueue()).flushed).toBe(0); expect(mocks.create).not.toHaveBeenCalled(); expect((await loadQueue()).length).toBe(2);
  });
  it('retains rejected writes and allows an explicit retry', async () => {
    await saveQueue([makeItem()]); mocks.create.mockRejectedValueOnce({ status: 403 });
    expect((await flushQueue()).blocked).toBe(1); expect((await loadQueue())[0].blocked).toBe(true);
    await flushQueue(); expect(mocks.create).toHaveBeenCalledTimes(1);
    expect((await flushQueue({ retryBlocked: true })).flushed).toBe(1); expect(await loadQueue()).toEqual([]);
  });
  it('keeps exhausted network retries available for recovery', async () => {
    await saveQueue([makeItem({ attempts: 4 })]); mocks.create.mockRejectedValueOnce(new TypeError('Offline'));
    await flushQueue(); expect((await loadQueue())[0].blocked).toBe(true); expect((await loadQueue()).length).toBe(1);
  });
  it('reconciles a server-saved pin after its response was lost', async () => {
    await saveQueue([makeItem()]); mocks.filter.mockResolvedValueOnce([{ id: 'already-saved' }]);
    expect((await flushQueue()).flushed).toBe(1); expect(mocks.create).not.toHaveBeenCalled(); expect(await loadQueue()).toEqual([]);
  });
  it('serializes simultaneous enqueue operations', async () => {
    navigator.onLine = false;
    await Promise.all(['Quartz', 'Agate'].map(mineral_name => queueWrite({ entity: 'PrivateRockLog', ownerId: user.id, data: { owner_email: user.email, mineral_name } })));
    expect((await loadQueue()).map(item => item.data.mineral_name)).toEqual(['Quartz', 'Agate']);
  });
  it('stops replay if the session changes during sync', async () => {
    await saveQueue([makeItem()]); mocks.me.mockResolvedValueOnce(user).mockResolvedValueOnce({ id: 'other', email: 'other@example.test' });
    await flushQueue(); expect(mocks.create).not.toHaveBeenCalled(); expect((await loadQueue()).length).toBe(1);
  });
  it('scopes pending counts to the current owner', async () => {
    await saveQueue([makeItem(), makeItem({ ownerId: 'other' })]); expect(getQueueLength(user)).toBe(1);
    expect(belongsToUser(makeItem({ ownerId: undefined }), user)).toBe(true);
  });
  it('preserves a server-saved pin if acknowledging it locally fails', async () => {
    await saveQueue([makeItem()]); const original = localStorage.setItem; let failed = false;
    localStorage.setItem = (name, value) => { if (name === key && !failed) { failed = true; throw new Error('Quota'); } return original(name, value); };
    expect((await flushQueue()).flushed).toBe(0); expect((await loadQueue())[0].data.offline_write_id).toBe('pending-1');
  });
});