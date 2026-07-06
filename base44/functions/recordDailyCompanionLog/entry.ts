// recordDailyCompanionLog
// Snapshots every user's Companion state into CompanionLog so we can
// render a "daily summary" with mood + XP gains on the Hub.
//
// Designed to be run by a daily scheduled automation (admin-only invoke).
// Idempotent per (owner_email, log_date) — if a log for today already
// exists it gets updated rather than duplicated.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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
    let written = 0;

    // Compute today range for specimen counts
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Optimization: Batch fetch all specimens created today to avoid N+1 in the loop
    // We fetch a reasonably large batch of recent specimens.
    const allRecentSpecimens = await sdk.entities.Specimen.list('-created_date', 5000).catch(() => []);
    const specimensByOwner = new Map();

    for (const s of allRecentSpecimens) {
      const d = new Date(s.created_date || 0);
      if (d < startOfDay) break; // Since it's sorted by -created_date, we can stop

      const owner = s.created_by;
      if (!owner) continue;
      specimensByOwner.set(owner, (specimensByOwner.get(owner) || 0) + 1);
    }

    // Optimization: Batch fetch today's existing logs to avoid N+1 check in the loop
    const existingLogsToday = await sdk.entities.CompanionLog.filter({
      log_date: date,
    }).catch(() => []);
    const logsTodayByOwner = new Map(existingLogsToday.map(l => [l.owner_email, l]));

    const toCreate = [];
    const toUpdate = [];

    for (const c of companions) {
      if (!c.owner_email) continue;

      const specimens_today = specimensByOwner.get(c.owner_email) || 0;

      // Find the previous log for delta calculation
      // Note: This still performs an N+1 query. While we could batch fetch recent logs,
      // finding the "last one before today" for every user is complex to do efficiently
      // without a specialized aggregate query. We prioritize the specimens and today's logs first.
      const prior = await sdk.entities.CompanionLog.filter(
        { owner_email: c.owner_email },
        '-log_date',
        1
      ).catch(() => []);
      const lastXp = prior?.[0]?.xp ?? 0;
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

      const existing = logsTodayByOwner.get(c.owner_email);
      if (existing) {
        toUpdate.push({ id: existing.id, ...payload });
      } else {
        toCreate.push(payload);
      }
    }

    if (toCreate.length > 0) {
      await sdk.entities.CompanionLog.bulkCreate(toCreate);
      written += toCreate.length;
    }
    if (toUpdate.length > 0) {
      await sdk.entities.CompanionLog.bulkUpdate(toUpdate);
      written += toUpdate.length;
    }

    return Response.json({ ok: true, written, date });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
