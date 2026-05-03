import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Returns (and lazily creates) the user's Companion pet state.
 * Also computes a fresh streak from recent Specimens + check-ins, and
 * decays energy if the user hasn't shown up today.
 *
 * Payload: {} (no args — user is derived from auth)
 * Returns: { companion: {...}, todays_specimens: number }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().slice(0, 10);

    // Find or create companion
    const existing = await base44.entities.Companion.filter({ owner_email: user.email });
    let companion = existing[0];
    if (!companion) {
      companion = await base44.entities.Companion.create({
        owner_email: user.email,
        name: 'Amethyst',
        level: 1,
        xp: 0,
        energy: 80,
        mood: 'calm',
        streak_days: 0,
      });
    }

    // Recompute streak: walk backward from today, day by day, while there's
    // either a check-in or a new specimen on that date.
    const recentSpecimens = await base44.entities.Specimen.filter(
      { created_by: user.email },
      '-created_date',
      60
    );
    const findDates = new Set(
      recentSpecimens
        .map((s) => (s.found_date || s.created_date || '').slice(0, 10))
        .filter(Boolean)
    );
    const lastCheck = companion.last_check_in_date || null;

    let streak = 0;
    const cursor = new Date(today + 'T00:00:00Z');
    for (let i = 0; i < 60; i++) {
      const key = cursor.toISOString().slice(0, 10);
      const hadActivity = findDates.has(key) || lastCheck === key;
      if (hadActivity) {
        streak += 1;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      } else if (i === 0) {
        // Today might be empty but yesterday's streak still counts —
        // start counting from yesterday.
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      } else {
        break;
      }
    }

    // Energy decay: if user hasn't checked in today AND last check was >1 day ago,
    // shave a bit off energy (gentle, not punishing).
    let energy = companion.energy ?? 80;
    if (lastCheck !== today) {
      const daysSince = lastCheck
        ? Math.floor((new Date(today) - new Date(lastCheck)) / 86400000)
        : 7;
      energy = Math.max(20, energy - Math.min(20, daysSince * 5));
    }

    // Mood derivation from energy + streak (only if not freshly set today)
    let mood = companion.mood;
    if (lastCheck !== today) {
      if (energy >= 80 && streak >= 3) mood = 'radiant';
      else if (energy >= 60) mood = 'happy';
      else if (energy >= 40) mood = 'calm';
      else if (energy >= 25) mood = 'drowsy';
      else mood = 'tender';
    }

    // Persist computed values if they changed
    const patch = {};
    if (streak !== companion.streak_days) patch.streak_days = streak;
    if (energy !== companion.energy) patch.energy = energy;
    if (mood !== companion.mood) patch.mood = mood;
    if (Object.keys(patch).length) {
      companion = await base44.entities.Companion.update(companion.id, patch);
    }

    const todaysSpecimens = recentSpecimens.filter(
      (s) => (s.found_date || s.created_date || '').slice(0, 10) === today
    ).length;

    return Response.json({ companion, todays_specimens: todaysSpecimens });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});