/**
 * ISO-week helpers shared by the Find of the Week backend functions.
 * Week runs Monday 00:00 UTC → next Monday 00:00 UTC.
 */

export function weekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7; // 1 = Mon … 7 = Sun
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Thursday of this ISO week
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export function weekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const dayNum = d.getUTCDay() || 7;
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - (dayNum - 1)));
  const end = new Date(start.getTime() + 7 * 86400000);
  return { start, end };
}