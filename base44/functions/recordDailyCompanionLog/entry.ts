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

    // --- OPTIMIZATION: Batch Fetching ---

    // 1. Fetch all today's logs to handle idempotency
    const allTodaysLogs = await sdk.entities.CompanionLog.filter({ log_date: date }).catch(() => []);
    const todaysLogsByEmail = new Map(allTodaysLogs.map(l => [l.owner_email, l]));

    // 2. Fetch recent specimens for all users to compute specimens_today
    // Assuming 5000 is enough to cover all of today's finds for all users.
    const recentSpecimens = await sdk.entities.Specimen.list('-created_date', 5000).catch(() => []);
    const specimensByEmail = new Map<string, any[]>();
    for (const s of recentSpecimens) {
      if (!s.created_by) continue;
      const d = new Date(s.created_date || 0);
      if (d >= startOfDay) {
        if (!specimensByEmail.has(s.created_by)) specimensByEmail.set(s.created_by, []);
        specimensByEmail.get(s.created_by)!.push(s);
      }
    }

    // 3. Fetch recent logs to find "prior" for delta calculation
    // We need the latest log before today for each user.
    const recentLogs = await sdk.entities.CompanionLog.list('-log_date', 5000).catch(() => []);
    const priorLogsByEmail = new Map<string, any>();
    for (const l of recentLogs) {
      if (!l.owner_email) continue;
      if (l.log_date === date) continue; // Skip today's logs
      if (!priorLogsByEmail.has(l.owner_email)) {
        // Since list is sorted by -log_date, the first one we find is the latest prior log
        priorLogsByEmail.set(l.owner_email, l);
      }
    }

    const toCreate: any[] = [];
    const toUpdate: any[] = [];

    for (const c of companions) {
      if (!c.owner_email) continue;

      const specimens_today = specimensByEmail.get(c.owner_email)?.length || 0;

      const prior = priorLogsByEmail.get(c.owner_email);
      const lastXp = prior?.xp ?? 0;
      const xp_gained = Math.max(0, (c.xp ?? 0) - lastXp);

      const todaysLog = todaysLogsByEmail.get(c.owner_email);

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

      if (todaysLog) {
        toUpdate.push({ id: todaysLog.id, ...payload });
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
