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

    for (const c of companions) {
      if (!c.owner_email) continue;

      // Specimens this user logged today (best-effort; filter by created_by)
      const specimensToday = await sdk.entities.Specimen.filter({
        created_by: c.owner_email,
      }).catch(() => []);
      const specimens_today = (specimensToday || []).filter((s) => {
        const d = new Date(s.created_date || 0);
        return d >= startOfDay;
      }).length;

      // Find the previous log for delta calculation
      const prior = await sdk.entities.CompanionLog.filter(
        { owner_email: c.owner_email },
        '-log_date',
        1
      ).catch(() => []);
      const lastXp = prior?.[0]?.xp ?? 0;
      const xp_gained = Math.max(0, (c.xp ?? 0) - lastXp);

      // Upsert today's row
      const todays = await sdk.entities.CompanionLog.filter({
        owner_email: c.owner_email,
        log_date: date,
      }).catch(() => []);

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

      if (todays.length > 0) {
        await sdk.entities.CompanionLog.update(todays[0].id, payload);
      } else {
        await sdk.entities.CompanionLog.create(payload);
      }
      written += 1;
    }

    return Response.json({ ok: true, written, date });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});