// applyEvents — the sync engine room.
// Applies a batch of client outbox events against the server replica with:
//   • idempotency   — every event id is answered once, replays come from the ledger
//   • rev checks    — FIND_UPDATE carries base_rev; fast-forward applies, divergence merges
//   • deterministic merges — notes concatenate, photos union by sha256, id_results append-only,
//                            scalars resolve by client timestamp; ties become SyncConflict rows
//   • tenant safety — every lookup is scoped to owner_email, so a client can never touch
//                     another user's records by guessing an id
//   • cursor        — returns the high-water mark (max updated_date) the client should pull from

export const EVENT_TYPES = Object.freeze({
  FIND_CREATE: 'FIND_CREATE',
  FIND_UPDATE: 'FIND_UPDATE',
  FIND_DELETE: 'FIND_DELETE',
  FIND_SET_PRIVACY: 'FIND_SET_PRIVACY',
  PHOTO_ADD_LOCAL: 'PHOTO_ADD_LOCAL',
  PHOTO_UPLOAD_POINTER: 'PHOTO_UPLOAD_POINTER',
  PHOTO_DELETE: 'PHOTO_DELETE',
  ID_RESULT_APPEND: 'ID_RESULT_APPEND',
});

export const MAX_BATCH = 100;
const MAX_NOTES = 5000;
const MAX_TITLE = 200;
const MAX_RAW_JSON_BYTES = 50_000;
const MAX_ALTERNATIVES = 3;
const MAX_NEXT_CHECKS = 5;
const PRECISIONS = new Set([0, 50, 500, -1]);
const FIND_MUTABLE = new Set(['title', 'notes', 'captured_at', 'location_accuracy_m']);
const PHOTO_KINDS = new Set(['original', 'preview', 'thumb', 'ai_upload']);
const TIERS = new Set(['offline_fast', 'online_deep']);

const isStr = (v) => typeof v === 'string' && v.length > 0;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const clampStr = (v, max) => (typeof v === 'string' ? v.slice(0, max) : undefined);

// ─── Validation ────────────────────────────────────────────────────────────

export function validateEvent(ev) {
  if (!isObj(ev)) return 'event_not_object';
  if (!isStr(ev.id)) return 'missing_id';
  if (!isStr(ev.type) || !EVENT_TYPES[ev.type]) return 'unknown_type';
  if (!isStr(ev.entity_id)) return 'missing_entity_id';
  if (!isObj(ev.payload)) return 'missing_payload';
  const p = ev.payload;
  switch (ev.type) {
    case EVENT_TYPES.FIND_UPDATE:
      if (!Number.isInteger(p.base_rev) || p.base_rev < 1) return 'missing_base_rev';
      if (!isObj(p.fields)) return 'missing_fields';
      if (!isNum(p.updated_at)) return 'missing_updated_at';
      if (typeof p.fields.notes === 'string' && p.fields.notes.length > MAX_NOTES) return 'notes_too_long';
      break;
    case EVENT_TYPES.FIND_SET_PRIVACY:
      if (!PRECISIONS.has(p.precision_m)) return 'invalid_precision';
      if (p.precision_m !== -1 && (!isNum(p.fuzz_lat) || !isNum(p.fuzz_lng))) return 'missing_fuzz_coords';
      if (p.precision_m !== -1 && (Math.abs(p.fuzz_lat) > 90 || Math.abs(p.fuzz_lng) > 180)) return 'coords_out_of_range';
      break;
    case EVENT_TYPES.PHOTO_ADD_LOCAL:
      if (!isStr(p.find_id)) return 'missing_find_id';
      if (!isStr(p.sha256) || !/^[a-f0-9]{64}$/i.test(p.sha256)) return 'invalid_sha256';
      if (p.kind !== undefined && !PHOTO_KINDS.has(p.kind)) return 'invalid_kind';
      break;
    case EVENT_TYPES.PHOTO_UPLOAD_POINTER:
      if (!isStr(p.remote_url) || !/^https:\/\//.test(p.remote_url)) return 'invalid_remote_url';
      break;
    case EVENT_TYPES.ID_RESULT_APPEND:
      if (!isStr(p.find_id)) return 'missing_find_id';
      if (!TIERS.has(p.tier)) return 'invalid_tier';
      if (!isStr(p.model_name) || !isStr(p.model_version)) return 'missing_model_provenance';
      if (!isNum(p.confidence) || p.confidence < 0 || p.confidence > 1) return 'invalid_confidence';
      if (p.raw_json !== undefined && JSON.stringify(p.raw_json).length > MAX_RAW_JSON_BYTES) return 'raw_json_too_large';
      break;
    default:
      break;
  }
  return null;
}

// ─── Merge policies ────────────────────────────────────────────────────────

export function mergeNotes(serverNotes, clientNotes, clientTs) {
  const s = (serverNotes || '').trim();
  const c = (clientNotes || '').trim();
  if (!s || s === c || c.includes(s)) return c.slice(0, MAX_NOTES);
  if (!c || s.includes(c)) return s;
  const stamp = new Date(clientTs || Date.now()).toISOString();
  return `${s}\n\n— merged ${stamp} —\n${c}`.slice(0, MAX_NOTES);
}

// Returns { patch, lost } where `lost` holds client values the server refused (server won).
export function mergeFind(server, payload) {
  const fastForward = payload.base_rev === server.rev;
  const clientTs = Number(payload.updated_at) || 0;
  const serverTs = Number(server.client_updated_at) || 0;
  const patch = {};
  const lost = {};
  for (const [key, value] of Object.entries(payload.fields)) {
    if (!FIND_MUTABLE.has(key)) continue;
    const v = key === 'title' ? clampStr(value, MAX_TITLE) : key === 'notes' ? clampStr(value, MAX_NOTES) : value;
    if (fastForward) { patch[key] = v; continue; }
    if (key === 'notes') { patch.notes = mergeNotes(server.notes, v, clientTs); continue; }
    if (clientTs > serverTs) patch[key] = v;
    else if (v !== server[key]) lost[key] = { server: server[key], client: v };
  }
  return { patch, lost, fastForward };
}

// ─── Cursor ────────────────────────────────────────────────────────────────

export function nextCursor(records, fallback) {
  let max = fallback || null;
  for (const r of records) {
    if (r?.updated_date && (!max || r.updated_date > max)) max = r.updated_date;
  }
  return max;
}

// ─── Engine ────────────────────────────────────────────────────────────────

export async function applyEvents({ entities, ownerEmail, events, cursor = null }) {
  const acked = [];
  const rejected = [];
  const conflicts = [];
  const touched = [];

  // 1. Idempotency: answer replays from the ledger without re-applying.
  const ids = events.map((e) => e?.id).filter(isStr);
  const priorRows = ids.length
    ? await entities.SyncEventLedger.filter({ owner_email: ownerEmail, event_id: { $in: ids } })
    : [];
  const prior = new Map(priorRows.map((r) => [r.event_id, r]));

  const ctx = { entities, ownerEmail, touched, conflicts };

  // 2. Apply in client order — later events in a batch may depend on earlier ones.
  for (const ev of events) {
    const invalid = validateEvent(ev);
    if (invalid) { rejected.push({ event_id: ev?.id ?? null, reason: invalid }); continue; }

    const seen = prior.get(ev.id);
    if (seen) {
      if (seen.status === 'acked') acked.push({ event_id: ev.id, rev: seen.result_rev ?? null, replay: true });
      else rejected.push({ event_id: ev.id, reason: seen.reason, replay: true });
      continue;
    }

    const outcome = await HANDLERS[ev.type](ctx, ev);

    await entities.SyncEventLedger.create({
      event_id: ev.id,
      owner_email: ownerEmail,
      domain: ev.domain || domainOf(ev.type),
      type: ev.type,
      entity_id: ev.entity_id,
      status: outcome.ok ? 'acked' : 'rejected',
      reason: outcome.reason,
      result_rev: outcome.rev,
      conflict_id: outcome.conflict_id,
    });
    prior.set(ev.id, { status: outcome.ok ? 'acked' : 'rejected', reason: outcome.reason, result_rev: outcome.rev });

    if (outcome.ok) acked.push({ event_id: ev.id, rev: outcome.rev ?? null, ...(outcome.conflict_id ? { conflict_id: outcome.conflict_id } : {}) });
    else rejected.push({ event_id: ev.id, reason: outcome.reason });
  }

  return { acked, rejected, conflicts, new_cursor: nextCursor(touched, cursor) };
}

function domainOf(type) {
  if (type.startsWith('FIND_')) return 'finds';
  if (type.startsWith('PHOTO_')) return 'photos';
  return 'id_results';
}

async function getFind(ctx, clientId) {
  const rows = await ctx.entities.SyncFind.filter({ owner_email: ctx.ownerEmail, client_id: clientId });
  return rows[0] || null;
}
async function getPhoto(ctx, clientId) {
  const rows = await ctx.entities.SyncPhoto.filter({ owner_email: ctx.ownerEmail, client_id: clientId });
  return rows[0] || null;
}

async function recordConflict(ctx, ev, entity, local, remote, fields) {
  const row = await ctx.entities.SyncConflict.create({
    owner_email: ctx.ownerEmail,
    entity,
    entity_id: ev.entity_id,
    event_id: ev.id,
    local_json: local,
    remote_json: remote,
    fields,
  });
  ctx.conflicts.push({ conflict_id: row.id, entity, entity_id: ev.entity_id, fields });
  return row.id;
}

const HANDLERS = {
  async [EVENT_TYPES.FIND_CREATE](ctx, ev) {
    const p = ev.payload;
    const existing = await getFind(ctx, ev.entity_id);
    if (existing) { ctx.touched.push(existing); return { ok: true, rev: existing.rev, reason: 'already_exists' }; }
    const precision = PRECISIONS.has(p.location_precision_m) ? p.location_precision_m : 500;
    const row = await ctx.entities.SyncFind.create({
      client_id: ev.entity_id,
      owner_email: ctx.ownerEmail,
      device_id: clampStr(p.device_id, 120),
      rev: 1,
      title: clampStr(p.title, MAX_TITLE),
      notes: clampStr(p.notes, MAX_NOTES),
      location_precision_m: precision,
      ...(precision !== -1 && isNum(p.location_fuzz_lat) && isNum(p.location_fuzz_lng)
        ? { location_fuzz_lat: p.location_fuzz_lat, location_fuzz_lng: p.location_fuzz_lng, geohash_fuzz: clampStr(p.geohash_fuzz, 16) }
        : {}),
      ...(isNum(p.location_accuracy_m) ? { location_accuracy_m: p.location_accuracy_m } : {}),
      ...(isNum(p.captured_at) ? { captured_at: p.captured_at } : {}),
      client_updated_at: isNum(p.updated_at) ? p.updated_at : Date.now(),
      sync_state: 'synced',
    });
    ctx.touched.push(row);
    return { ok: true, rev: 1 };
  },

  async [EVENT_TYPES.FIND_UPDATE](ctx, ev) {
    const p = ev.payload;
    const server = await getFind(ctx, ev.entity_id);
    if (!server) return { ok: false, reason: 'not_found' };
    if (server.deleted_at) return { ok: false, reason: 'deleted' };
    if (p.base_rev > server.rev) return { ok: false, reason: 'base_rev_ahead_of_server' };

    const { patch, lost } = mergeFind(server, p);
    let conflictId;
    if (Object.keys(lost).length) {
      conflictId = await recordConflict(ctx, ev, 'find', { rev: p.base_rev, fields: p.fields }, pickFields(server, Object.keys(lost)), Object.keys(lost));
    }
    const nextRev = server.rev + 1;
    const row = await ctx.entities.SyncFind.update(server.id, {
      ...patch,
      rev: nextRev,
      client_updated_at: Math.max(Number(server.client_updated_at) || 0, p.updated_at),
      sync_state: conflictId ? 'conflicted' : 'synced',
    });
    ctx.touched.push(row || { ...server, ...patch, updated_date: new Date().toISOString() });
    return { ok: true, rev: nextRev, conflict_id: conflictId };
  },

  async [EVENT_TYPES.FIND_DELETE](ctx, ev) {
    const server = await getFind(ctx, ev.entity_id);
    if (!server) return { ok: true, reason: 'not_found_noop' };
    if (server.deleted_at) { ctx.touched.push(server); return { ok: true, rev: server.rev, reason: 'already_deleted' }; }
    const nextRev = server.rev + 1;
    const row = await ctx.entities.SyncFind.update(server.id, { deleted_at: Date.now(), rev: nextRev });
    ctx.touched.push(row || server);
    return { ok: true, rev: nextRev };
  },

  async [EVENT_TYPES.FIND_SET_PRIVACY](ctx, ev) {
    const p = ev.payload;
    const server = await getFind(ctx, ev.entity_id);
    if (!server) return { ok: false, reason: 'not_found' };
    const nextRev = server.rev + 1;
    const patch = p.precision_m === -1
      ? { location_precision_m: -1, location_fuzz_lat: null, location_fuzz_lng: null, geohash_fuzz: null }
      : { location_precision_m: p.precision_m, location_fuzz_lat: p.fuzz_lat, location_fuzz_lng: p.fuzz_lng, geohash_fuzz: clampStr(p.geohash_fuzz, 16) };
    const row = await ctx.entities.SyncFind.update(server.id, { ...patch, rev: nextRev });
    ctx.touched.push(row || server);
    return { ok: true, rev: nextRev };
  },

  async [EVENT_TYPES.PHOTO_ADD_LOCAL](ctx, ev) {
    const p = ev.payload;
    const find = await getFind(ctx, p.find_id);
    if (!find) return { ok: false, reason: 'find_not_found' };
    const existing = await getPhoto(ctx, ev.entity_id);
    if (existing) { ctx.touched.push(existing); return { ok: true, reason: 'already_exists' }; }
    // Union by sha256 — the same bytes attached twice (two devices) is one photo.
    const dupes = await ctx.entities.SyncPhoto.filter({ owner_email: ctx.ownerEmail, find_client_id: p.find_id, sha256: p.sha256.toLowerCase() });
    if (dupes[0]) { ctx.touched.push(dupes[0]); return { ok: true, reason: 'deduped_by_sha256' }; }
    const row = await ctx.entities.SyncPhoto.create({
      client_id: ev.entity_id,
      find_client_id: p.find_id,
      owner_email: ctx.ownerEmail,
      kind: p.kind || 'original',
      sha256: p.sha256.toLowerCase(),
      ...(Number.isInteger(p.width) ? { width: p.width } : {}),
      ...(Number.isInteger(p.height) ? { height: p.height } : {}),
      ...(Number.isInteger(p.bytes) ? { bytes: p.bytes } : {}),
      sync_state: 'local_only',
    });
    ctx.touched.push(row);
    return { ok: true };
  },

  async [EVENT_TYPES.PHOTO_UPLOAD_POINTER](ctx, ev) {
    const p = ev.payload;
    const photo = await getPhoto(ctx, ev.entity_id);
    if (!photo) return { ok: false, reason: 'not_found' };
    if (photo.remote_url === p.remote_url) { ctx.touched.push(photo); return { ok: true, reason: 'already_set' }; }
    const row = await ctx.entities.SyncPhoto.update(photo.id, { remote_url: p.remote_url, sync_state: 'synced' });
    ctx.touched.push(row || photo);
    return { ok: true };
  },

  async [EVENT_TYPES.PHOTO_DELETE](ctx, ev) {
    const photo = await getPhoto(ctx, ev.entity_id);
    if (!photo) return { ok: true, reason: 'not_found_noop' };
    if (photo.deleted_at) { ctx.touched.push(photo); return { ok: true, reason: 'already_deleted' }; }
    const row = await ctx.entities.SyncPhoto.update(photo.id, { deleted_at: Date.now() });
    ctx.touched.push(row || photo);
    return { ok: true };
  },

  async [EVENT_TYPES.ID_RESULT_APPEND](ctx, ev) {
    const p = ev.payload;
    const find = await getFind(ctx, p.find_id);
    if (!find) return { ok: false, reason: 'find_not_found' };
    const existing = await ctx.entities.SyncIdResult.filter({ owner_email: ctx.ownerEmail, client_id: ev.entity_id });
    if (existing[0]) { ctx.touched.push(existing[0]); return { ok: true, reason: 'already_exists' }; }

    // Append-only: an online deep result supersedes prior rows for the same find, never overwrites them.
    if (p.tier === 'online_deep') {
      const prior = await ctx.entities.SyncIdResult.filter({ owner_email: ctx.ownerEmail, find_client_id: p.find_id, is_superseded: false });
      for (const r of prior) {
        const upd = await ctx.entities.SyncIdResult.update(r.id, { is_superseded: true });
        ctx.touched.push(upd || r);
      }
    }
    const row = await ctx.entities.SyncIdResult.create({
      client_id: ev.entity_id,
      find_client_id: p.find_id,
      owner_email: ctx.ownerEmail,
      tier: p.tier,
      model_name: clampStr(p.model_name, 120),
      model_version: clampStr(p.model_version, 60),
      ...(isNum(p.input_quality) ? { input_quality: p.input_quality } : {}),
      confidence: p.confidence,
      primary_label: clampStr(p.primary_label, 120),
      alternatives: Array.isArray(p.alternatives) ? p.alternatives.slice(0, MAX_ALTERNATIVES) : [],
      features: isObj(p.features) ? p.features : {},
      explanation_short: clampStr(p.explanation_short, 1000),
      explanation_nerd: clampStr(p.explanation_nerd, 4000),
      next_checks: Array.isArray(p.next_checks) ? p.next_checks.slice(0, MAX_NEXT_CHECKS) : [],
      collecting_tips: clampStr(p.collecting_tips, 2000),
      safety_notes: clampStr(p.safety_notes, 2000),
      formation: clampStr(p.formation, 2000),
      raw_json: isObj(p.raw_json) ? p.raw_json : {},
      is_superseded: false,
      client_created_at: isNum(p.created_at) ? p.created_at : Date.now(),
    });
    ctx.touched.push(row);
    return { ok: true };
  },
};

function pickFields(obj, keys) {
  const out = {};
  for (const k of keys) out[k] = obj[k];
  return out;
}