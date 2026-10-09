/**
 * scanQuota — server-side metering for signed-in AI identifications.
 *
 * Free members get FREE_DAILY_SCANS identifications per UTC day; paid
 * subscribers and admins are unlimited. Every identification the server
 * runs leaves a ScanReceipt, which is both the meter and the trusted record
 * a later save is checked against (so XP never depends on a client-sent
 * rarity).
 */
import {
  FREE_DAILY_SCANS,
  isPaidSubscription,
  monthKey,
  dayStartIso,
  nextDayStartIso,
} from './subscriptionAccess.ts';

type Row = Record<string, unknown> & { id?: string; created_date?: string };
type EntityApi = {
  filter(query: Record<string, unknown>, sort?: string, limit?: number): Promise<Row[]>;
  create(data: Record<string, unknown>): Promise<Row>;
};
export type QuotaClient = {
  asServiceRole: {
    entities: {
      Subscription: EntityApi;
      ScanReceipt: EntityApi;
    };
  };
};

export type ScanQuota = {
  ok: boolean;
  paid: boolean;
  used: number | null;
  limit: number | null;
  resetAt: string | null;
};

const RARITIES = new Set(['common', 'uncommon', 'rare', 'legendary']);
const RECEIPT_TRUST_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function checkMemberScanQuota(
  base44: QuotaClient,
  user: { email: string; role?: string | null },
  now: Date = new Date(),
): Promise<ScanQuota> {
  if (user.role === 'admin') {
    return { ok: true, paid: true, used: null, limit: null, resetAt: null };
  }
  try {
    const subs = await base44.asServiceRole.entities.Subscription.filter(
      { owner_email: user.email }, '-updated_date', 1,
    );
    if (isPaidSubscription(subs?.[0] as never, now.getTime())) {
      return { ok: true, paid: true, used: null, limit: null, resetAt: null };
    }
    const rows = await base44.asServiceRole.entities.ScanReceipt.filter(
      { owner_email: user.email, created_date: { $gte: dayStartIso(now), $lt: nextDayStartIso(now) } },
      '-created_date',
      FREE_DAILY_SCANS + 1,
    );
    const used = rows?.length || 0;
    return {
      ok: used < FREE_DAILY_SCANS,
      paid: false,
      used,
      limit: FREE_DAILY_SCANS,
      resetAt: nextDayStartIso(now),
    };
  } catch (err) {
    // Metering must never take the scanner down: fail open and log.
    console.error('[scanQuota] check failed, allowing scan:', (err as Error)?.message);
    return { ok: true, paid: false, used: null, limit: FREE_DAILY_SCANS, resetAt: null };
  }
}

export async function recordScanReceipt(
  base44: QuotaClient,
  ownerEmail: string,
  identification: { top_match?: unknown; rarity?: unknown; confidence?: unknown } | null,
  imageUrl: string,
  now: Date = new Date(),
): Promise<void> {
  try {
    await base44.asServiceRole.entities.ScanReceipt.create({
      owner_email: ownerEmail,
      kind: 'member_identify',
      month_key: monthKey(now),
      image_url: String(imageUrl || '').slice(0, 1000),
      top_match: String(identification?.top_match || '').slice(0, 200),
      rarity: RARITIES.has(String(identification?.rarity)) ? identification?.rarity : 'common',
      confidence: typeof identification?.confidence === 'number' ? identification.confidence : null,
    });
  } catch (err) {
    console.error('[scanQuota] receipt write failed:', (err as Error)?.message);
  }
}

/**
 * The server's own record of a recent identification that matches what a
 * client is now saving: same image first, else same mineral name, within
 * the last 24 hours. Returns null when nothing matches.
 */
export async function findTrustedReceipt(
  base44: QuotaClient,
  ownerEmail: string,
  imageUrl: string | null | undefined,
  topMatch: string | null | undefined,
  now: Date = new Date(),
): Promise<{ top_match: string; rarity: string } | null> {
  try {
    const rows = await base44.asServiceRole.entities.ScanReceipt.filter(
      { owner_email: ownerEmail }, '-created_date', 25,
    );
    const fresh = (rows || []).filter((r) => {
      const t = Date.parse(String(r.created_date || ''));
      return Number.isFinite(t) && now.getTime() - t <= RECEIPT_TRUST_WINDOW_MS;
    });
    const norm = (s: unknown) => String(s || '').trim().toLowerCase();
    const hit =
      (imageUrl && fresh.find((r) => r.image_url === imageUrl)) ||
      (topMatch && fresh.find((r) => norm(r.top_match) && norm(r.top_match) === norm(topMatch))) ||
      null;
    if (!hit) return null;
    return {
      top_match: String(hit.top_match || ''),
      rarity: RARITIES.has(String(hit.rarity)) ? String(hit.rarity) : 'common',
    };
  } catch {
    return null;
  }
}