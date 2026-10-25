/**
 * liveEyes — metering and output hygiene for Live Specimen Eyes
 * (the quickClassifySpecimen function behind the live labels on /scan).
 *
 * Every live label costs an AI call, so three layers keep it honest:
 *   1. the client only asks when the hunter holds steady on something new
 *      (src/lib/liveEyes.js);
 *   2. a per-isolate burst limiter here stops floods before they reach the
 *      database or the model;
 *   3. a durable per-member daily meter (LiveEyesMeter rows) caps usage:
 *      free members get a taste, paid members get plenty, admins are
 *      uncapped. Tune the caps in LIVE_DAILY_LIMIT.
 *
 * Live labels are a preview. The full, metered identification still runs
 * through identifySpecimen when the hunter taps "Lock ID" or the shutter.
 */
import { isPaidSubscription } from './subscriptionAccess.ts';

export const LIVE_DAILY_LIMIT = { free: 15, paid: 300 } as const;
export const BURST = { calls: 10, windowMs: 60_000, minGapMs: 1_200 } as const;
export const QUALITIES = ['good', 'blurry', 'dark', 'glare', 'too_far'] as const;
export type LiveQuality = typeof QUALITIES[number];

const RARITIES = new Set(['common', 'uncommon', 'rare', 'legendary']);
const MAX_TRACKED_KEYS = 5_000;

/** UTC day a live call counts against, e.g. "2026-09-26". */
export function dayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Start of the next UTC day — when the daily allowance resets. */
export function nextDayStartIso(date: Date = new Date()): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1)).toISOString();
}

const bursts = new Map<string, number[]>();

/**
 * Sliding-window burst guard, per isolate. Rejects calls closer together
 * than BURST.minGapMs or more than BURST.calls per window.
 */
export function burstCheck(
  key: string,
  now: number = Date.now(),
  store: Map<string, number[]> = bursts,
): { ok: boolean; retryAfterMs: number } {
  const recent = (store.get(key) || []).filter((t) => now - t < BURST.windowMs);
  const last = recent[recent.length - 1];
  if (last !== undefined && now - last < BURST.minGapMs) {
    store.set(key, recent);
    return { ok: false, retryAfterMs: BURST.minGapMs - (now - last) };
  }
  if (recent.length >= BURST.calls) {
    store.set(key, recent);
    return { ok: false, retryAfterMs: Math.max(0, BURST.windowMs - (now - recent[0])) };
  }
  recent.push(now);
  store.delete(key);
  store.set(key, recent); // re-insert so Map order tracks recency
  if (store.size > MAX_TRACKED_KEYS) {
    for (const k of store.keys()) {
      store.delete(k);
      if (store.size <= MAX_TRACKED_KEYS * 0.8) break;
    }
  }
  return { ok: true, retryAfterMs: 0 };
}

type Row = Record<string, unknown> & { id?: string };
type EntityApi = {
  filter(query: Record<string, unknown>, sort?: string, limit?: number): Promise<Row[]>;
  create(data: Record<string, unknown>): Promise<Row>;
  update(id: string, data: Record<string, unknown>): Promise<Row>;
};
export type MeterClient = {
  asServiceRole: {
    entities: {
      Subscription: EntityApi;
      LiveEyesMeter: EntityApi;
    };
  };
};

export type LiveMeter = {
  ok: boolean;
  paid: boolean;
  used: number | null;
  limit: number | null;
  resetAt: string;
};

/**
 * Check and consume one live call for this member. Fails open on storage
 * errors (the burst guard still applies) so a database hiccup never takes
 * the scanner down.
 */
export async function meterLiveCall(
  base44: MeterClient,
  user: { email: string; role?: string | null },
  now: Date = new Date(),
): Promise<LiveMeter> {
  const resetAt = nextDayStartIso(now);
  if (user.role === 'admin') {
    return { ok: true, paid: true, used: null, limit: null, resetAt };
  }

  let paid = false;
  try {
    const subs = await base44.asServiceRole.entities.Subscription.filter(
      { owner_email: user.email }, '-updated_date', 1,
    );
    paid = isPaidSubscription(subs?.[0] as never, now.getTime());
  } catch (err) {
    console.error('[liveEyes] subscription lookup failed:', err);
  }
  const limit = paid ? LIVE_DAILY_LIMIT.paid : LIVE_DAILY_LIMIT.free;

  try {
    const Meter = base44.asServiceRole.entities.LiveEyesMeter;
    const day = dayKey(now);
    const rows = await Meter.filter({ owner_email: user.email, day_key: day }, '-updated_date', 1);
    const row = rows?.[0];
    const used = Math.max(0, Math.floor(Number(row?.count) || 0));
    if (used >= limit) return { ok: false, paid, used, limit, resetAt };
    if (row?.id) await Meter.update(row.id, { count: used + 1 });
    else await Meter.create({ owner_email: user.email, day_key: day, count: 1 });
    return { ok: true, paid, used: used + 1, limit, resetAt };
  } catch (err) {
    console.error('[liveEyes] meter failed, allowing call:', err);
    return { ok: true, paid, used: null, limit, resetAt };
  }
}

export type LiveCandidate = { name: string; rarity: string; confidence: number; x: number; y: number };
export type LiveResult = { specimen_visible: boolean; quality: LiveQuality; candidates: LiveCandidate[] };

function clamp01(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
}

/**
 * Normalise whatever the model returned into a small, safe shape:
 * known quality words, known rarities, 0-1 numbers, at most three
 * candidates, best first, none at all when no specimen is in view.
 */
export function cleanLiveResult(raw: unknown): LiveResult {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const quality = (QUALITIES as readonly string[]).includes(String(r.quality))
    ? (r.quality as LiveQuality)
    : 'good';
  const list = Array.isArray(r.candidates) ? r.candidates : [];
  const candidates: LiveCandidate[] = list
    .filter((c): c is Record<string, unknown> =>
      !!c && typeof c === 'object' && typeof (c as Record<string, unknown>).name === 'string'
      && !!String((c as Record<string, unknown>).name).trim())
    .map((c) => ({
      name: String(c.name).replace(/\s+/g, ' ').trim().slice(0, 60),
      rarity: RARITIES.has(String(c.rarity)) ? String(c.rarity) : 'common',
      confidence: clamp01(c.confidence, 0),
      x: clamp01(c.x, 0.5),
      y: clamp01(c.y, 0.5),
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
  const visible = r.specimen_visible === false ? false : candidates.length > 0 || r.specimen_visible === true;
  return { specimen_visible: visible, quality, candidates: visible ? candidates : [] };
}

/** Short, printable place hint for the prompt (user-supplied, so kept tiny). */
export function cleanRegionHint(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[^\p{L}\p{N} ,.'-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}
