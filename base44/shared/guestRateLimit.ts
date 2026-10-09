/**
 * Guest rate limits for public Clover / scan endpoints.
 * In-memory (per isolate) plus durable CompanionLog markers when available.
 */

import { FREE_DAILY_SCANS, dayStartIso, nextDayStartIso } from './subscriptionAccess.ts';

export type GuestRateAction = 'identify' | 'cloverChat' | 'synthesizeSpeech';

const LIMITS: Record<GuestRateAction, { limit: number; windowMs: number }> = {
  identify: { limit: FREE_DAILY_SCANS, windowMs: 24 * 60 * 60 * 1000 },
  cloverChat: { limit: 25, windowMs: 24 * 60 * 60 * 1000 },
  synthesizeSpeech: { limit: 40, windowMs: 24 * 60 * 60 * 1000 },
};

type Bucket = { count: number; resetAt: number };
const memory = new Map<string, Bucket>();

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function normalizeGuestId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const id = raw.trim().slice(0, 80);
  if (!id.startsWith('g_') || id.length < 8) return null;
  return id;
}

function memKey(action: GuestRateAction, guestId: string) {
  return `${action}:${guestId}`;
}

function touchMemory(action: GuestRateAction, guestId: string, consume: boolean) {
  const cfg = LIMITS[action];
  const key = memKey(action, guestId);
  const now = Date.now();
  let entry = memory.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: action === 'identify' ? Date.parse(nextDayStartIso(new Date(now))) : now + cfg.windowMs };
    memory.set(key, entry);
  }
  if (entry.count >= cfg.limit) {
    return { ok: false as const, remaining: 0, resetAt: entry.resetAt, limit: cfg.limit };
  }
  if (consume) entry.count += 1;
  return {
    ok: true as const,
    remaining: Math.max(0, cfg.limit - entry.count),
    resetAt: entry.resetAt,
    limit: cfg.limit,
  };
}

type LogClient = {
  asServiceRole: {
    entities: {
      CompanionLog: {
        filter(query: Record<string, unknown>, sort?: string, limit?: number): Promise<Array<{ id: string }>>;
        create(data: Record<string, unknown>): Promise<unknown>;
      };
    };
  };
};

/**
 * Check (and optionally consume) a guest quota slot.
 * Durable marker uses CompanionLog owner_email = guest:<id>.
 */
export async function enforceGuestRate(
  base44: LogClient | null,
  guestIdRaw: unknown,
  action: GuestRateAction,
  { consume = true }: { consume?: boolean } = {},
) {
  const guestId = normalizeGuestId(guestIdRaw);
  if (!guestId) {
    return { ok: false as const, error: 'guest_device_id required', status: 400 };
  }

  // Durable check for identify (must survive isolate restarts)
  if (action === 'identify' && base44?.asServiceRole?.entities?.CompanionLog) {
    try {
      const now = new Date();
      const resetAt = Date.parse(nextDayStartIso(now));
      const rows = await base44.asServiceRole.entities.CompanionLog.filter(
        { owner_email: `guest:${guestId}`, log_type: 'guest_identify', created_date: { $gte: dayStartIso(now), $lt: nextDayStartIso(now) } },
        '-created_date',
        FREE_DAILY_SCANS,
      );
      const used = rows?.length || 0;
      if (used >= FREE_DAILY_SCANS) {
        return { ok: false as const, error: 'You have used your 7 free scans today', status: 429, resetAt, remaining: 0, limit: FREE_DAILY_SCANS };
      }
      if (consume) {
        await base44.asServiceRole.entities.CompanionLog.create({
          owner_email: `guest:${guestId}`,
          log_type: 'guest_identify',
          summary: `guest identify ${dayKey(now)}`,
          mood: 'neutral',
        });
      }
      memory.set(memKey(action, guestId), { count: used + Number(consume), resetAt });
      return { ok: true as const, guestId, remaining: FREE_DAILY_SCANS - used - Number(consume), limit: FREE_DAILY_SCANS, resetAt };
    } catch {
      /* fall through to memory */
    }
  }

  // Soft durable markers for chat/TTS (daily)
  if ((action === 'cloverChat' || action === 'synthesizeSpeech') && consume && base44?.asServiceRole?.entities?.CompanionLog) {
    try {
      const rows = await base44.asServiceRole.entities.CompanionLog.filter(
        { owner_email: `guest:${guestId}`, log_type: `guest_${action}`, summary: dayKey() },
        '-created_date',
        LIMITS[action].limit + 1,
      );
      if ((rows?.length || 0) >= LIMITS[action].limit) {
        return {
          ok: false as const,
          error: 'Guest rate limit exceeded',
          status: 429,
          remaining: 0,
          limit: LIMITS[action].limit,
          resetAt: Date.now() + 60 * 60 * 1000,
        };
      }
      await base44.asServiceRole.entities.CompanionLog.create({
        owner_email: `guest:${guestId}`,
        log_type: `guest_${action}`,
        summary: dayKey(),
        mood: 'neutral',
      });
    } catch {
      /* memory fallback */
    }
  }

  const mem = touchMemory(action, guestId, consume);
  if (!mem.ok) {
    return {
      ok: false as const,
      error: 'Guest rate limit exceeded',
      status: 429,
      remaining: 0,
      limit: mem.limit,
      resetAt: mem.resetAt,
    };
  }
  return {
    ok: true as const,
    guestId,
    remaining: mem.remaining,
    limit: mem.limit,
    resetAt: mem.resetAt,
  };
}