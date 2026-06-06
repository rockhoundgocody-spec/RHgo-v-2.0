import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function getDayKeyForTimezone(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Records the user's daily mood + intention, refills companion energy,
 * grants XP, and levels up if XP threshold is crossed.
 *
 * Payload: {
 *   mood_label: string,
 *   intention?: string,
 *   timezone?: string,      // IANA timezone from client (ex: "America/Los_Angeles")
 *   local_day_key?: string, // Client day key in YYYY-MM-DD
 * }
 *
 * Fallback behavior when timezone/day key are missing or invalid:
 * - Try validating timezone and deriving day key from it.
 * - Otherwise use a valid local_day_key if provided.
 * - Otherwise fall back to server UTC day key.
 *
 * Returns: { companion, leveled_up: boolean }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mood_label, intention, timezone, local_day_key } = await req.json();
    if (!mood_label || typeof mood_label !== 'string') {
      return Response.json({ error: 'mood_label required' }, { status: 400 });
    }

    const trimmedTimezone = typeof timezone === 'string' ? timezone.trim() : '';
    const normalizedLocalDayKey =
      typeof local_day_key === 'string' && DAY_KEY_PATTERN.test(local_day_key)
        ? local_day_key
        : null;

    let today = new Date().toISOString().slice(0, 10);

    if (trimmedTimezone) {
      try {
        today = getDayKeyForTimezone(trimmedTimezone);
      } catch {
        // Invalid timezone; continue with day-key/server fallback.
        if (normalizedLocalDayKey) {
          today = normalizedLocalDayKey;
        }
      }
    } else if (normalizedLocalDayKey) {
      today = normalizedLocalDayKey;
    }

    const existing = await base44.entities.Companion.filter({ owner_email: user.email });
    let companion =
      existing[0] ||
      (await base44.entities.Companion.create({
        owner_email: user.email,
        name: 'Amethyst',
        level: 1,
        xp: 0,
        energy: 80,
        mood: 'calm',
        streak_days: 0,
      }));

    // Block double-check-ins for the same normalized day key (idempotent).
    if (companion.last_check_in_date === today) {
      return Response.json({ companion, leveled_up: false, already_checked_in: true });
    }

    // Mood mapping from user-facing label → companion mood vibe
    const moodMap = {
      great: 'radiant',
      good: 'happy',
      okay: 'calm',
      tired: 'drowsy',
      low: 'tender',
    };
    const newMood = moodMap[mood_label.toLowerCase()] || 'calm';

    const xpGain = 15; // check-in reward
    let xp = (companion.xp || 0) + xpGain;
    let level = companion.level || 1;
    let leveled = false;
    // Simple curve: each level needs level*50 xp
    while (xp >= level * 50) {
      xp -= level * 50;
      level += 1;
      leveled = true;
    }

    const updated = await base44.entities.Companion.update(companion.id, {
      energy: 100,
      mood: newMood,
      last_check_in_date: today,
      last_mood_label: mood_label,
      last_intention: intention || null,
      xp,
      level,
    });

    return Response.json({ companion: updated, leveled_up: leveled });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
