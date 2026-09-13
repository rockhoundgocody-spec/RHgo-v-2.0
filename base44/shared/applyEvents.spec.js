import { describe, it, expect } from 'npm:vitest@4.1.9';
import { applyEvents } from './applyEvents.ts';
import { syncTestStore } from './syncTestStore.js';
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const owner = 'test-owner';
const hash = 'a'.repeat(64);
const event = (n, type, entity, base_rev, payload = {}) => ({ id: id(n), type, entity_id: id(entity), base_rev, payload });
const create = event(1, 'FIND_CREATE', 100, 0, { title: 'Agate', notes: 'Field notes', captured_at: 1000 });
const photo = event(2, 'PHOTO_ADD_LOCAL', 200, 0, { find_id: id(100), sha256: hash, kind: 'original', width: 100, height: 100, bytes: 2000 });
const upload = event(3, 'PHOTO_UPLOAD_POINTER', 200, 1, { media_id: id(300) });
const result = event(4, 'ID_RESULT_APPEND', 400, 0, { find_id: id(100), photo_id: id(200), primary_label: 'Agate', confidence: 0.6, alternatives: [{ label: 'Chert', confidence: 0.3 }], model_name: 'offline', model_version: '1', explanation_short: 'Banding visible.', next_checks: [{ action: 'Inspect luster', expected_outcome: 'Waxy surface' }] });
const push = (store, events, principal = { id: owner }) => applyEvents({ principal, events, store, now: 2000 });
function setup() {
  const store = syncTestStore();
  store.seed(owner, 'media', id(300), { owner_id: owner, sha256: hash, file_uri: 'private://test/photo.jpg' });
  return store;
}
describe('applyEvents transaction contract (in-memory adapter only)', () => {
  it('applies all eight event types with revisions, tombstones and cursors', async () => {
    const store = setup();
    const events = [create, photo, upload, result,
      event(5, 'FIND_UPDATE', 100, 1, { notes: 'Updated' }),
      event(6, 'FIND_SET_PRIVACY', 100, 2, { location_precision_m: 500, lat: 44.12345, lng: -88.12345 }),
      event(7, 'PHOTO_DELETE', 200, 2), event(8, 'FIND_DELETE', 100, 3)];
    const r = await push(store, events);
    expect(r.rejected).toEqual([]); expect(r.acked).toHaveLength(8); expect(r.new_cursor).toBe('8');
    const s = store.snapshot().owners[owner];
    expect(s.finds[id(100)]).toMatchObject({ rev: 4, deleted_at: 2000, location_fuzz_lat: null, location_precision_m: -1 });
    expect(s.photos[id(200)]).toMatchObject({ rev: 3, deleted_at: 2000, file_uri: null });
    expect(s.id_results[id(400)]).toMatchObject({ rev: 1, inputs_hash: hash, verified: false, provenance: 'client_submitted' });
    expect(s.changes.map(c => c.cursor)).toEqual(['1','2','3','4','5','6','7','8']);
  });
  it('replays an identical event without a new write or cursor', async () => {
    const store = setup(); await push(store, [create]); const r = await push(store, [create]);
    expect(r.acked).toEqual([create.id]); expect(r.changes).toEqual([]); expect(r.new_cursor).toBe('1');
  });
  it('treats reordered object keys as identical', async () => {
    const store = setup(); await push(store, [create]);
    const r = await push(store, [{ ...create, payload: { captured_at: 1000, notes: 'Field notes', title: 'Agate' } }]);
    expect(r.acked).toEqual([create.id]);
  });
  it('rejects an idempotency key reused with different data', async () => {
    const store = setup(); await push(store, [create]);
    const r = await push(store, [{ ...create, payload: { ...create.payload, title: 'Forgery' } }]);
    expect(r.rejected[0].reason).toBe('IDEMPOTENCY_KEY_REUSED');
    expect(store.snapshot().owners[owner].finds[id(100)].title).toBe('Agate');
  });
  it('records stale-revision conflicts without overwriting notes', async () => {
    const store = setup(); await push(store, [create]);
    const stale = event(5, 'FIND_UPDATE', 100, 0, { notes: 'stale' });
    const r = await push(store, [stale]); expect(r.rejected[0].reason).toBe('REV_CONFLICT');
    expect(r.new_cursor).toBe('1'); expect(store.snapshot().owners[owner].conflicts[stale.id].status).toBe('needs_review');
    expect(store.snapshot().owners[owner].finds[id(100)].notes).toBe('Field notes');
    expect((await push(store, [stale])).rejected).toEqual(r.rejected);
  });
  it('isolates owner namespaces', async () => {
    const store = setup(); await push(store, [create]);
    const r = await push(store, [event(5, 'FIND_UPDATE', 100, 1, { notes: 'attack' })], { id: 'other-owner' });
    expect(r.rejected[0].reason).toBe('NOT_FOUND'); expect(r.changes).toEqual([]);
    expect(store.snapshot().owners[owner].finds[id(100)].notes).toBe('Field notes');
  });
  it('rejects foreign-owner rows even with a faulty adapter', async () => {
    const store = setup(); store.seed(owner, 'finds', id(100), { owner_id: 'other-owner', rev: 1 });
    expect((await push(store, [event(5, 'FIND_UPDATE', 100, 1, { title: 'attack' })])).rejected[0].reason).toBe('NOT_FOUND');
  });
  it('requires authenticated principal and bounded batches', async () => {
    await expect(push(setup(), [create], null)).rejects.toThrow('UNAUTHENTICATED');
    await expect(push(setup(), Array(26).fill(create))).rejects.toThrow('INVALID_BATCH');
  });
  it('rejects malformed events without mutation', async () => {
    const r = await push(setup(), [null, {}, { ...create, type: 'ADMIN_OVERRIDE' }]);
    expect(r.rejected).toHaveLength(3); expect(r.new_cursor).toBe('0'); expect(r.acked).toEqual([]);
  });
  it('rejects protected fields and oversized events', async () => {
    const r = await push(setup(), [{ ...create, payload: { ...create.payload, owner_id: 'other' } }, { ...create, id: id(2), payload: { ...create.payload, notes: 'x'.repeat(40000) } }]);
    expect(r.rejected.map(x => x.reason)).toEqual(['UNKNOWN_FIELD', 'EVENT_TOO_LARGE']);
  });
  it('rejects prototype pollution keys', async () => {
    const p = JSON.parse('{"captured_at":1000,"__proto__":{"admin":true}}');
    expect((await push(setup(), [{ ...create, payload: p }])).rejected[0].reason).toBe('UNKNOWN_FIELD');
    expect({}.admin).toBeUndefined();
  });
  it('quantizes GPS and stores only hashes in receipts', async () => {
    const store = setup(); await push(store, [create, event(5, 'FIND_SET_PRIVACY', 100, 1, { location_precision_m: 500, lat: 44.12345678, lng: -88.12345678 })]);
    const s = store.snapshot().owners[owner]; expect(s.finds[id(100)].location_fuzz_lat).not.toBe(44.12345678);
    expect(JSON.stringify(s)).not.toContain('44.12345678'); expect(s.receipts[id(5)].fingerprint).toMatch(/^[a-f0-9]{64}$/);
    await push(store, [event(6, 'FIND_SET_PRIVACY', 100, 2, { location_precision_m: -1 })]);
    expect(store.snapshot().owners[owner].finds[id(100)].location_fuzz_lat).toBeNull();
  });
  it.each([{location_precision_m: 0, lat: 44, lng: 0}, {location_precision_m: 500, lat: 91, lng: 0}, {location_precision_m: 50, lat: 0, lng: 181}])('rejects invalid coordinate policy %j', async p => {
    const store = setup(); await push(store, [create]);
    expect((await push(store, [event(5, 'FIND_SET_PRIVACY', 100, 1, p)])).rejected).toHaveLength(1);
  });
  it('accepts valid zero coordinates', async () => {
    const store = setup(); const r = await push(store, [create, event(5, 'FIND_SET_PRIVACY', 100, 1, {location_precision_m:50, lat:0, lng:0})]);
    expect(r.rejected).toEqual([]); expect(store.snapshot().owners[owner].finds[id(100)].location_fuzz_lat).toBe(0);
  });
  it('rejects media without verified ownership or matching hash', async () => {
    const store = setup(); await push(store, [create, photo]);
    store.seed(owner, 'media', id(300), { owner_id:'other', sha256:hash, file_uri:'private://other' });
    expect((await push(store, [upload])).rejected[0].reason).toBe('UNVERIFIED_MEDIA');
    store.seed(owner, 'media', id(300), { owner_id:owner, sha256:'b'.repeat(64), file_uri:'private://other' });
    expect((await push(store, [{...upload,id:id(6)}])).rejected[0].reason).toBe('UNVERIFIED_MEDIA');
  });
  it('rejects arbitrary remote image URLs', async () => {
    const store = setup(); await push(store, [create, photo]);
    expect((await push(store, [{ ...upload, payload: { remote_url:'https://example.com/secret' } }])).rejected[0].reason).toBe('UNKNOWN_FIELD');
  });
  it('rejects photos exceeding byte and pixel budgets', async () => {
    const store = setup(); await push(store, [create]);
    const r = await push(store, [{...photo,payload:{...photo.payload,bytes:30*1024*1024}}, {...photo,id:id(8),payload:{...photo.payload,width:10000,height:10000}}]);
    expect(r.rejected).toHaveLength(2); expect(r.changes).toEqual([]);
  });
  it('keeps identification history append-only', async () => {
    const store = setup(); await push(store, [create, photo, upload, result]);
    expect((await push(store, [{...result,id:id(9)}])).rejected[0].reason).toBe('APPEND_ONLY');
  });
  it('bounds confidence and alternatives', async () => {
    const store = setup(); await push(store, [create, photo, upload]);
    const r = await push(store, [{...result,payload:{...result.payload,confidence:1.2}}, {...result,id:id(9),payload:{...result.payload,alternatives:Array(4).fill({label:'Quartz',confidence:0.5})}}]);
    expect(r.rejected).toHaveLength(2);
  });
  it('does not resurrect deleted parents', async () => {
    const store = setup(); await push(store, [create, photo, upload, event(5,'FIND_DELETE',100,1)]);
    const r = await push(store, [event(6,'FIND_UPDATE',100,2,{title:'revive'}), result]);
    expect(r.rejected.map(x=>x.reason)).toEqual(['DELETED','DELETED']);
  });
  it('rolls back mutation and cursor on storage failure', async () => {
    const store = setup(); const before = store.snapshot(); store.failOnChange = true;
    await expect(push(store,[create])).rejects.toThrow('storage failure'); expect(store.snapshot()).toEqual(before);
    store.failOnChange = false; expect((await push(store,[create])).new_cursor).toBe('1');
  });
  it('serializes concurrent duplicates in the adapter contract', async () => {
    const store = setup(); const [a,b] = await Promise.all([push(store,[create]),push(store,[create])]);
    expect(a.acked).toEqual(b.acked); expect(a.changes.length+b.changes.length).toBe(1);
    expect(store.snapshot().owners[owner].cursor).toBe('1');
  });
  it('preserves cursors beyond JavaScript safe integers', async () => {
    const store = setup();
    const wrapper = { transaction: (who, fn) => store.transaction(who, tx => fn({...tx, getCursor: async()=> '9007199254740993'})) };
    expect((await push(wrapper,[])).new_cursor).toBe('9007199254740993');
  });
});