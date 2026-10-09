import { describe, it, expect, vi } from 'npm:vitest@3.2.4';
import { deletionScopes, deleteAccountBatch } from './accountDeletion.ts';
const user = { id: 'owner-a', email: 'owner@example.test' };
function values(row, path) {
  let values = [row];
  for (const part of path.split('.')) values = values.flatMap(value => Array.isArray(value) ? value.map(item => item?.[part]) : [value?.[part]]).flat();
  return values;
}
function matches(row, query) {
  return Object.entries(query).every(([key, value]) => {
    if (key === '$or') return value.some(item => matches(row, item));
    if (key === '$and') return value.every(item => matches(row, item));
    const found = values(row, key);
    if (value && typeof value === 'object') {
      if ('$exists' in value) return value.$exists ? found.some(item => item !== undefined) : found.every(item => item === undefined);
      if ('$in' in value) return found.some(item => value.$in.includes(item));
    }
    return found.includes(value);
  });
}
function clientFor(initial = {}) {
  const data = Object.fromEntries(Object.entries(initial).map(([name, rows]) => [name, rows.map(row => ({ ...row }))]));
  const calls = [];
  const entities = new Proxy({}, { get: (_, name) => ({
    filter: vi.fn(async (query, sort, limit) => (data[name] || []).filter(row => matches(row, query)).slice(0, limit)),
    delete: vi.fn(async id => { calls.push(['delete', name, id]); data[name] = (data[name] || []).filter(row => row.id !== id); }),
    update: vi.fn(async (id, patch) => { calls.push(['update', name, id]); data[name] = data[name].map(row => row.id === id ? { ...row, ...patch } : row); })
  }) });
  return { client: { asServiceRole: { entities } }, data, calls };
}
describe('authenticated account cleanup', () => {
  it('rejects an absent account before computing any deletion filters', () => { expect(() => deletionScopes({})).toThrow('authenticated'); });
  it('covers all personal collections and excludes shared catalog data', () => {
    const names = deletionScopes(user).map(scope => scope.name);
    expect(names).toContain('PrivateRockLog'); expect(names).toContain('ScanReceipt'); expect(names).toContain('SyncPhoto');
    expect(names).not.toContain('Hotspot'); expect(names).not.toContain('Mineral'); expect(names).not.toContain('MLModel');
  });
  it('dry runs make no changes and do not cancel billing', async () => {
    const fixture = clientFor({ Subscription: [{ id: 'sub-row', owner_email: user.email, stripe_subscription_id: 'sub_test' }] });
    const cancel = vi.fn(); const result = await deleteAccountBatch(fixture.client, user, { dryRun: true, cancelSubscription: cancel });
    expect(result.dry_run).toBe(true); expect(result.account_deleted).toBe(false); expect(fixture.calls).toEqual([]); expect(cancel).not.toHaveBeenCalled();
  });
  it('does not delete other users records merely because this admin created them', async () => {
    const fixture = clientFor({ PlayerProfile: [{ id: 'other-profile', owner_email: 'other@example.test', created_by_id: user.id }], PrivateRockLog: [{ id: 'own-log', owner_email: user.email }], User: [{ id: user.id }] });
    await deleteAccountBatch(fixture.client, user);
    expect(fixture.data.PlayerProfile).toHaveLength(1); expect(fixture.data.PrivateRockLog).toEqual([]);
    expect(fixture.calls.at(-1)).toEqual(['delete', 'User', user.id]);
  });
  it('scrubs personal references without deleting other authors posts', async () => {
    const fixture = clientFor({ Post: [{ id: 'other-post', owner_email: 'other@example.test', comments: [{ email: user.email, body: 'My comment' }, { email: 'other@example.test', body: 'Keep' }], reactors: [{ email: user.email, type: 'fire' }] }], ClubEvent: [{ id: 'other-event', owner_email: 'other@example.test', rsvp_emails: [user.email, 'other@example.test'] }] });
    await deleteAccountBatch(fixture.client, user);
    expect(fixture.data.Post[0].comments).toHaveLength(1); expect(fixture.data.Post[0].reactors).toEqual([]);
    expect(fixture.data.ClubEvent[0].rsvp_emails).toEqual(['other@example.test']); expect(fixture.data.ClubEvent[0].rsvp_count).toBe(1);
  });
  it('can resume bounded batches and removes the app user only after completion', async () => {
    const fixture = clientFor({ PrivateRockLog: [{ id: 'one', owner_email: user.email }, { id: 'two', owner_email: user.email }] });
    const first = await deleteAccountBatch(fixture.client, user, { limit: 1 });
    expect(first.complete).toBe(false); expect(fixture.calls.some(call => call[1] === 'User')).toBe(false);
    await deleteAccountBatch(fixture.client, user, { limit: 1 });
    expect((await deleteAccountBatch(fixture.client, user)).complete).toBe(true);
  });
  it('cancels recurring billing before removing its record', async () => {
    const fixture = clientFor({ Subscription: [{ id: 'billing', owner_email: user.email, stripe_subscription_id: 'sub_test' }] });
    const cancel = vi.fn(async () => { expect(fixture.data.Subscription).toHaveLength(1); });
    await deleteAccountBatch(fixture.client, user, { cancelSubscription: cancel }); expect(cancel).toHaveBeenCalledWith('sub_test', user);
  });
  it('retains membership and billing when cancellation fails', async () => {
    const fixture = clientFor({ Subscription: [{ id: 'billing', owner_email: user.email, stripe_subscription_id: 'sub_test' }] });
    await expect(deleteAccountBatch(fixture.client, user, { cancelSubscription: async () => { throw new Error('Billing failed'); } })).rejects.toThrow('Billing failed');
    expect(fixture.data.Subscription).toHaveLength(1); expect(fixture.calls.some(call => call[1] === 'User')).toBe(false);
  });
  it('removes training photos linked to owned specimens before deleting those specimens', async () => {
    const fixture = clientFor({ Specimen: [{ id: 'own-specimen', created_by_id: user.id }], TrainingCandidate: [{ id: 'training', created_by_id: 'service', specimen_id: 'own-specimen' }] });
    await deleteAccountBatch(fixture.client, user); expect(fixture.data.TrainingCandidate).toEqual([]);
    expect(fixture.calls.findIndex(call => call[1] === 'TrainingCandidate')).toBeLessThan(fixture.calls.findIndex(call => call[1] === 'Specimen'));
  });
});