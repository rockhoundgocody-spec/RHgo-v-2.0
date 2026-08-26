// recordDailyCompanionLog
// Snapshots every user's Companion state into CompanionLog so we can
// render a "daily summary" with mood + XP gains on the Hub.
//
// Designed to be run by a daily scheduled automation (admin-only invoke).
// Idempotent per (owner_email, log_date) — if a log for today already
// exists it gets updated rather than duplicated.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import {
  chunkValues,
  collectPages,
  countByOwner,
  firstByOwner,
  writeLogsInBatches,
} from './operations.ts';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const sdk = base44.asServiceRole;
    const date = todayISO();

    const companions = await collectPages((limit, skip) =>
      sdk.entities.Companion.list('-updated_date', limit, skip)
    );
    const ownerEmails = [...new Set(companions.map((companion) => companion.owner_email).filter(Boolean))];
    const startOfDay = `${date}T00:00:00.000Z`;
    const specimensTodayByEmail = new Map();
    const todaysLogsByEmail = new Map();
    const priorLogsByEmail = new Map();

    for (const emailBatch of chunkValues(ownerEmails, 100)) {
      const [specimens, todaysLogs, priorLogs] = await Promise.all([
        collectPages((limit, skip) => sdk.entities.Specimen.filter(
          { created_by: { $in: emailBatch }, created_date: { $gte: startOfDay } },
          '-created_date',
          limit,
          skip,
        )),
        collectPages((limit, skip) => sdk.entities.CompanionLog.filter(
          { owner_email: { $in: emailBatch }, log_date: date },
          '-updated_date',
          limit,
          skip,
        )),
        collectPages((limit, skip) => sdk.entities.CompanionLog.filter(
          { owner_email: { $in: emailBatch }, log_date: { $lt: date } },
          '-log_date',
          limit,
          skip,
        )),
      ]);

      for (const [email, count] of countByOwner(specimens, 'created_by')) {
        specimensTodayByEmail.set(email, count);
      }
      for (const [email, log] of firstByOwner(todaysLogs, 'owner_email')) {
        todaysLogsByEmail.set(email, log);
      }
      for (const [email, log] of firstByOwner(priorLogs, 'owner_email')) {
        priorLogsByEmail.set(email, log);
      }
    }

    const writes = [];

    for (const c of companions) {
      if (!c.owner_email) continue;
      const lastXp = priorLogsByEmail.get(c.owner_email)?.xp ?? 0;
      const xp_gained = Math.max(0, (c.xp ?? 0) - lastXp);

      const payload = {
        owner_email: c.owner_email,
        log_date: date,
        mood: c.mood || 'calm',
        level: c.level ?? 1,
        xp: c.xp ?? 0,
        xp_gained,
        energy: c.energy ?? 80,
        streak_days: c.streak_days ?? 0,
        specimens_today: specimensTodayByEmail.get(c.owner_email) || 0,
      };
      writes.push({ id: todaysLogsByEmail.get(c.owner_email)?.id, payload });
    }

    const { written, failed } = await writeLogsInBatches(
      writes,
      (id, payload) => sdk.entities.CompanionLog.update(id, payload),
      (payload) => sdk.entities.CompanionLog.create(payload),
    );

    if (failed > 0) {
      return Response.json({ ok: false, written, failed, date }, { status: 500 });
    }

    return Response.json({ ok: true, written, failed: 0, date });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
