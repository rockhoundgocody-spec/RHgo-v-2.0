import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Admin-only maintenance: finds Mineral records with identical names,
// keeps the OLDEST copy of each, deletes the rest.
// Pass { dryRun: true } to preview without deleting.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let dryRun = false;
    try {
      const body = await req.json();
      dryRun = !!body?.dryRun;
    } catch { /* no body */ }

    // Page through all minerals
    const all = [];
    let skip = 0;
    const pageSize = 100;
    while (true) {
      const page = await base44.asServiceRole.entities.Mineral.list('created_date', pageSize, skip);
      all.push(...page);
      if (page.length < pageSize) break;
      skip += pageSize;
    }

    // Group by normalized name; keep oldest (list sorted ascending by created_date)
    const seen = new Map();
    const toDelete = [];
    for (const m of all) {
      const key = (m.name || '').trim().toLowerCase();
      if (!key) continue;
      if (seen.has(key)) {
        toDelete.push({ id: m.id, name: m.name, created_date: m.created_date });
      } else {
        seen.set(key, m.id);
      }
    }

    let deleted = 0;
    let failed = 0;
    if (!dryRun) {
      const batchSize = 10;
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const chunk = toDelete.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          chunk.map((d) => base44.asServiceRole.entities.Mineral.delete(d.id))
        );
        for (const res of results) {
          if (res.status === "fulfilled") {
            deleted++;
          } else {
            failed++;
          }
        }
      }
    }

    return Response.json({
      total_records: all.length,
      unique_names: seen.size,
      duplicates_found: toDelete.length,
      deleted,
      failed,
      dry_run: dryRun,
      duplicates: toDelete.map((d) => d.name),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});