/**
 * Replication engine v1. This is a storage-independent SERVER module, not an HTTP endpoint.
 * principal.id MUST come from verified Base44 authentication, never the request body.
 *
 * REQUIRED store contract: transaction(ownerId, callback) serializes ALL writes for
 * that owner and atomically commits/rolls back rows, receipts, conflicts and changes.
 * tx methods (async): get(table,id), put(table,id,row), getReceipt(id), putReceipt(id,row),
 * getCursor(), nextCursor(), appendChange(change), putConflict(id,row), getMedia(id).
 * ALL methods are owner-scoped, including media; tables: finds, photos, id_results.
 * nextCursor returns an increasing decimal STRING under an owner-row lock, NOT a
 * global SQL sequence allocated before commit. Unique constraints: (owner_id,id).
 * getMedia returns a server-confirmed {file_uri,sha256,owner_id} upload reservation.
 * A PostgreSQL adapter + /sync/push and /sync/pull are separate deployment work.
 * Never emulate the transaction with independent Base44 entity filter/create calls.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HASH = /^[0-9a-f]{64}$/;
const TYPES = new Set(['FIND_CREATE', 'FIND_UPDATE', 'FIND_DELETE', 'FIND_SET_PRIVACY', 'PHOTO_ADD_LOCAL', 'PHOTO_UPLOAD_POINTER', 'PHOTO_DELETE', 'ID_RESULT_APPEND']);
const object = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
function requireValue(ok, code = 'INVALID_EVENT') { if (!ok) throw new EventRejection(code); }
class EventRejection extends Error { constructor(code) { super(code); this.code = code; } }
function keys(value, allowed) {
  requireValue(object(value));
  requireValue(Object.keys(value).every(k => allowed.includes(k)), 'UNKNOWN_FIELD');
}
function text(value, max, optional = false) {
  requireValue((optional && value === undefined) || (typeof value === 'string' && value.length <= max && (optional || value.trim().length > 0)));
}
function integer(value, min = 0, max = Number.MAX_SAFE_INTEGER) { requireValue(Number.isSafeInteger(value) && value >= min && value <= max); }
function probability(value) { requireValue(Number.isFinite(value) && value >= 0 && value <= 1); }
function uuid(value) { requireValue(typeof value === 'string' && UUID.test(value)); }
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (object(value)) return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
function validateEnvelope(e) {
  keys(e, ['id', 'entity_id', 'type', 'base_rev', 'payload', 'created_at', 'device_id']);
  uuid(e.id); uuid(e.entity_id); requireValue(TYPES.has(e.type)); integer(e.base_rev);
  requireValue(object(e.payload));
  if (e.created_at !== undefined) integer(e.created_at);
  if (e.device_id !== undefined) text(e.device_id, 128);
  requireValue(new TextEncoder().encode(canonical(e)).length <= 32768, 'EVENT_TOO_LARGE');
}
function findFields(p, create) {
  keys(p, create ? ['title', 'notes', 'captured_at'] : ['title', 'notes']);
  text(p.title, 200, true); text(p.notes, 10000, true);
  if (create) integer(p.captured_at);
  requireValue(create || Object.keys(p).length > 0);
}
async function existing(tx, table, id, ownerId) {
  const row = await tx.get(table, id);
  requireValue(row && row.owner_id === ownerId, 'NOT_FOUND');
  requireValue(!row.deleted_at, 'DELETED');
  return row;
}
function revision(row, event) { requireValue(event.base_rev === row.rev, 'REV_CONFLICT'); }
function stamp(row, ownerId, now) {
  return { ...row, owner_id: ownerId, updated_at: now, rev: (row.rev || 0) + 1 };
}
function privacy(p) {
  keys(p, ['location_precision_m', 'lat', 'lng']);
  requireValue([-1, 50, 500].includes(p.location_precision_m), 'INVALID_PRIVACY');
  if (p.location_precision_m === -1) return { location_precision_m: -1, location_fuzz_lat: null, location_fuzz_lng: null };
  requireValue(Number.isFinite(p.lat) && Math.abs(p.lat) <= 90 && Number.isFinite(p.lng) && Math.abs(p.lng) <= 180, 'INVALID_COORDINATES');
  // Grid quantization, not an anonymity guarantee; raw coordinates never enter a row/receipt.
  const stepLat = p.location_precision_m / 111320;
  const stepLng = Math.min(360, stepLat / Math.max(0.000001, Math.cos(p.lat * Math.PI / 180)));
  return { location_precision_m: p.location_precision_m,
    location_fuzz_lat: Math.max(-90, Math.min(90, Math.round(p.lat / stepLat) * stepLat)),
    location_fuzz_lng: Math.max(-180, Math.min(180, Math.round(p.lng / stepLng) * stepLng)) };
}
async function mutate(tx, ownerId, e, now) {
  const p = e.payload;
  if (e.type === 'FIND_CREATE') {
    findFields(p, true); requireValue(e.base_rev === 0, 'REV_CONFLICT');
    requireValue(!(await tx.get('finds', e.entity_id)), 'ALREADY_EXISTS');
    return { table: 'finds', row: stamp({ id: e.entity_id, created_at: now, deleted_at: null, location_precision_m: -1, ...p }, ownerId, now) };
  }
  if (e.type.startsWith('FIND_')) {
    const row = await existing(tx, 'finds', e.entity_id, ownerId); revision(row, e);
    if (e.type === 'FIND_UPDATE') { findFields(p, false); return { table: 'finds', row: stamp({ ...row, ...p }, ownerId, now) }; }
    if (e.type === 'FIND_SET_PRIVACY') return { table: 'finds', row: stamp({ ...row, ...privacy(p) }, ownerId, now) };
    keys(p, []);
    return { table: 'finds', row: stamp({ ...row, deleted_at: now, title: '', notes: '', location_fuzz_lat: null, location_fuzz_lng: null, location_precision_m: -1 }, ownerId, now) };
  }
  if (e.type === 'PHOTO_ADD_LOCAL') {
    keys(p, ['find_id', 'sha256', 'kind', 'width', 'height', 'bytes']); uuid(p.find_id);
    requireValue(typeof p.sha256 === 'string' && HASH.test(p.sha256));
    requireValue(['original', 'preview', 'thumb', 'ai_upload'].includes(p.kind));
    integer(p.width, 1, 16384); integer(p.height, 1, 16384); integer(p.bytes, 1, 20 * 1024 * 1024);
    requireValue(p.width * p.height <= 40000000, 'IMAGE_TOO_LARGE');
    await existing(tx, 'finds', p.find_id, ownerId);
    requireValue(e.base_rev === 0, 'REV_CONFLICT'); requireValue(!(await tx.get('photos', e.entity_id)), 'ALREADY_EXISTS');
    return { table: 'photos', row: stamp({ id: e.entity_id, created_at: now, deleted_at: null, ...p, file_uri: null }, ownerId, now) };
  }
  if (e.type.startsWith('PHOTO_')) {
    const row = await existing(tx, 'photos', e.entity_id, ownerId);
    await existing(tx, 'finds', row.find_id, ownerId); revision(row, e);
    if (e.type === 'PHOTO_DELETE') {
      keys(p, []); return { table: 'photos', row: stamp({ ...row, deleted_at: now, file_uri: null }, ownerId, now) };
    }
    keys(p, ['media_id']); uuid(p.media_id);
    const media = await tx.getMedia(p.media_id);
    requireValue(media && media.owner_id === ownerId && media.sha256 === row.sha256 && typeof media.file_uri === 'string' && media.file_uri.length > 0, 'UNVERIFIED_MEDIA');
    return { table: 'photos', row: stamp({ ...row, file_uri: media.file_uri }, ownerId, now) };
  }
  keys(p, ['find_id', 'photo_id', 'primary_label', 'confidence', 'alternatives', 'model_name', 'model_version', 'explanation_short', 'next_checks']);
  uuid(p.find_id); uuid(p.photo_id); await existing(tx, 'finds', p.find_id, ownerId);
  const photo = await existing(tx, 'photos', p.photo_id, ownerId);
  requireValue(photo.find_id === p.find_id && photo.file_uri, 'UNVERIFIED_MEDIA');
  text(p.primary_label, 160); probability(p.confidence); text(p.model_name, 100); text(p.model_version, 100);
  text(p.explanation_short, 2000); requireValue(Array.isArray(p.alternatives) && p.alternatives.length <= 3);
  for (const a of p.alternatives) { keys(a, ['label', 'confidence']); text(a.label, 160); probability(a.confidence); }
  requireValue(Array.isArray(p.next_checks) && p.next_checks.length <= 5);
  for (const check of p.next_checks) { keys(check, ['action', 'expected_outcome', 'safety']); text(check.action, 500); text(check.expected_outcome, 500); text(check.safety, 500, true); }
  requireValue(e.base_rev === 0, 'REV_CONFLICT'); requireValue(!(await tx.get('id_results', e.entity_id)), 'APPEND_ONLY');
  return { table: 'id_results', row: stamp({ id: e.entity_id, created_at: now, ...p, inputs_hash: photo.sha256, provenance: 'client_submitted', verified: false }, ownerId, now) };
}
export async function applyEvents({ principal, events, store, now = Date.now() }) {
  if (!principal || typeof principal.id !== 'string' || !principal.id) throw new Error('UNAUTHENTICATED');
  if (!Array.isArray(events) || events.length > 25) throw new Error('INVALID_BATCH');
  integer(now, 1);
  // Canonical fingerprints are hashed: receipts must not retain raw private GPS or notes.
  const fingerprints = await Promise.all(events.map(async e => {
    const bytes = new TextEncoder().encode(canonical(e));
    if (bytes.length > 32768) return null;
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  }));
  return store.transaction(principal.id, async tx => {
    const acked = [], rejected = [], changes = [];
    for (let i = 0; i < events.length; i++) {
      const e = events[i]; let validEnvelope = false;
      try {
        validateEnvelope(e); validEnvelope = true;
        const previous = await tx.getReceipt(e.id);
        if (previous) {
          if (previous.fingerprint !== fingerprints[i]) { rejected.push({ event_id: e.id, reason: 'IDEMPOTENCY_KEY_REUSED' }); continue; }
          if (previous.reason) rejected.push({ event_id: e.id, reason: previous.reason });
          else acked.push(e.id);
          continue;
        }
        const mutation = await mutate(tx, principal.id, e, now);
        await tx.put(mutation.table, mutation.row.id, mutation.row);
        const cursor = await tx.nextCursor();
        const change = { cursor, entity: mutation.table, entity_id: mutation.row.id, rev: mutation.row.rev, deleted_at: mutation.row.deleted_at || null, data: mutation.row };
        await tx.appendChange(change);
        await tx.putReceipt(e.id, { fingerprint: fingerprints[i], cursor });
        acked.push(e.id); changes.push(change);
      } catch (error) {
        // Only deterministic input/ownership/revision rejections are acknowledged as
        // failures. Storage exceptions abort the transaction; never hide partial writes.
        if (!(error instanceof EventRejection)) throw error;
        const id = typeof e?.id === 'string' && UUID.test(e.id) ? e.id : null;
        rejected.push({ event_id: id, reason: error.code });
        if (validEnvelope) {
          if (error.code === 'REV_CONFLICT') await tx.putConflict(e.id, { entity_id: e.entity_id, event_type: e.type, base_rev: e.base_rev, created_at: now, status: 'needs_review' });
          await tx.putReceipt(e.id, { fingerprint: fingerprints[i], reason: error.code });
        }
      }
    }
    return { acked, rejected, changes, new_cursor: await tx.getCursor() };
  });
}