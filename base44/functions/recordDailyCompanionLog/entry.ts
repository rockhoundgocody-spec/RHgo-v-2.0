// recordDailyCompanionLog
// Snapshots every user's Companion state into CompanionLog so we can
// render a "daily summary" with mood + XP gains on the Hub.
//
// Designed to be run by a daily scheduled automation (admin-only invoke).
// Idempotent per (owner_email, log_date) — if a log for today already
// exists it gets updated rather than duplicated.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.35';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    // Allow admin invoke from UI/automation. Automations run with elevated
    // context but we still verify role for safety on direct calls.
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const sdk = base44.asServiceRole;
    const date = todayISO();

    // Pull all companions
    const companions = await sdk.entities.Companion.list();
    const emails = companions.map(c => c.owner_email).filter(Boolean) as string[];

    if (emails.length === 0) {
      return Response.json({ ok: true, written: 0, date });
    }

    // Compute today range for specimen counts
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 1. Batch fetch Specimens logged today for all owners
    const allSpecimensToday = await sdk.entities.Specimen.filter({
      created_by: { $in: emails },
      created_date: { $gte: startOfDay.toISOString() }
    }).catch(() => []);

    const specimensByOwner = allSpecimensToday.reduce((acc, s) => {
      if (s.created_by) {
        acc[s.created_by] = (acc[s.created_by] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // 2. Batch fetch prior logs for all owners to compute XP deltas
    // We fetch the most recent logs BEFORE today for these owners.
    const priorLogs = await sdk.entities.CompanionLog.filter(
      {
        owner_email: { $in: emails },
        log_date: { $lt: date }
      },
      '-log_date',
      emails.length * 3 // Fetch enough to likely get at least one prior for most users
    ).catch(() => []);

    const priorLogsByOwner = priorLogs.reduce((acc, l) => {
      if (l.owner_email) {
        // Since it's sorted by -log_date, the first one we see for an email is the most recent prior log.
        if (!acc[l.owner_email]) {
          acc[l.owner_email] = l;
        }
      }
      return acc;
    }, {} as Record<string, any>);

    // 3. Batch fetch today's logs to see what needs update vs create
    const todaysLogs = await sdk.entities.CompanionLog.filter({
      owner_email: { $in: emails },
      log_date: date,
    }).catch(() => []);

    const todaysLogsByOwner = todaysLogs.reduce((acc, l) => {
      if (l.owner_email) acc[l.owner_email] = l;
      return acc;
    }, {} as Record<string, any>);

    const toCreate = [];
    const toUpdate = [];

    for (const c of companions) {
      if (!c.owner_email) continue;

      const specimens_today = specimensByOwner[c.owner_email] || 0;
      const prior = priorLogsByOwner[c.owner_email];
      const lastXp = prior?.xp ?? 0;
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
        specimens_today,
      };

      const existing = todaysLogsByOwner[c.owner_email];
      if (existing) {
        toUpdate.push({ id: existing.id, ...payload });
      } else {
        toCreate.push(payload);
      }
    }

    // Perform bulk operations
    if (toCreate.length > 0) {
      await sdk.entities.CompanionLog.bulkCreate(toCreate);
    }
    if (toUpdate.length > 0) {
      await sdk.entities.CompanionLog.bulkUpdate(toUpdate);
    }

    return Response.json({ ok: true, written: toCreate.length + toUpdate.length, date });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
