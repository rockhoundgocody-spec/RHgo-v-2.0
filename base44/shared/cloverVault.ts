/**
 * cloverVault — grounds Clover in the hunter's own records.
 *
 * Builds a small searchable "vault" from the caller's specimens, private rock
 * log, expedition capsules and nearby public hotspots, retrieves the records
 * a question is about, and formats them as citable context ([S1], [S2] …).
 * Also enforces the one rule prompts alone can't: Clover never states a
 * price that no record or research result supports.
 *
 * Pure functions only — no Base44, no network — so it is fully unit-tested.
 */

export type VaultType = 'specimen' | 'log' | 'expedition' | 'site';

export type VaultItem = {
  key: string; // citation key, e.g. "S3"
  type: VaultType;
  id: string;
  label: string;
  place: string;
  date: string;
  rarity: string;
  text: string;
  route: string;
};

type Row = Record<string, unknown>;

const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'at', 'for', 'is', 'are', 'was', 'were', 'be',
  'my', 'me', 'i', 'you', 'your', 'it', 'its', 'this', 'that', 'these', 'those', 'what', 'which', 'who',
  'where', 'when', 'how', 'did', 'do', 'does', 'have', 'has', 'had', 'with', 'from', 'about', 'any',
  'can', 'could', 'would', 'should', 'there', 'here', 'clover', 'hey', 'please', 'tell', 'show', 'find',
  'found', 'get', 'got', 'some', 'much', 'many', 'one', 'ones', 'all', 'up', 'out', 'just', 'like',
  'know', 'think', 'really', 'um', 'uh', 'so', 'we', 'our', 'us', 'if', 'than', 'then', 'them', 'they',
]);

const RECENCY = /\b(last|latest|recent|recently|newest|today|yesterday|this week)\b/i;
const MAX_RECORDS = 6;

const str = (v: unknown, max = 400) => (v == null ? '' : String(v)).replace(/\s+/g, ' ').trim().slice(0, max);

export function tokenize(text: unknown): string[] {
  return str(text, 1000)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => (w.length > 4 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w));
}

function specimenItem(s: Row): Omit<VaultItem, 'key'> {
  const label = str(s.mineral_name || s.common_name, 120) || 'Unnamed specimen';
  return {
    type: 'specimen',
    id: str(s.id, 64),
    label,
    place: str(s.found_at, 120),
    date: str(s.found_date || s.created_date, 10),
    rarity: str(s.rarity, 20),
    text: [s.common_name && s.common_name !== s.mineral_name ? `aka ${s.common_name}` : '', s.disposition ? `disposition ${s.disposition}` : '', s.notes]
      .filter(Boolean).map((t) => str(t, 600)).join('. '),
    route: `/specimen/${str(s.id, 64)}`,
  };
}

function logItem(l: Row): Omit<VaultItem, 'key'> {
  return {
    type: 'log',
    id: str(l.id, 64),
    label: str(l.mineral_name, 120) || 'Field note',
    place: str(l.location_label, 120),
    date: str(l.found_date || l.created_date, 10),
    rarity: str(l.rarity, 20),
    text: [l.notes, l.weight_lbs ? `${l.weight_lbs} lb` : ''].filter(Boolean).map((t) => str(t, 600)).join('. '),
    route: '/private-log',
  };
}

function capsuleItem(c: Row): Omit<VaultItem, 'key'> {
  const highlights = Array.isArray(c.highlights) ? c.highlights.map((h) => str(h, 80)).join(', ') : '';
  return {
    type: 'expedition',
    id: str(c.id, 64),
    label: str(c.expedition_name, 120) || 'Expedition',
    place: str(c.location_name, 120),
    date: str(c.expedition_date || c.created_date, 10),
    rarity: '',
    text: [c.total_finds != null ? `${c.total_finds} finds` : '', highlights ? `highlights: ${highlights}` : '', c.story]
      .filter(Boolean).map((t) => str(t, 600)).join('. '),
    route: '/expeditions',
  };
}

function siteItem(h: Row, distanceKm: number | null): Omit<VaultItem, 'key'> {
  const minerals = Array.isArray(h.minerals) ? h.minerals.map((m) => str(m, 40)).join(', ') : '';
  return {
    type: 'site',
    id: str(h.id, 64),
    label: str(h.name, 120) || 'Collecting site',
    place: [h.state, h.country].map((x) => str(x, 40)).filter(Boolean).join(', '),
    date: '',
    rarity: '',
    text: [
      distanceKm != null ? `${Math.round(distanceKm)} km away` : '',
      h.land_type ? `land: ${str(h.land_type, 40)}` : '',
      h.access_status ? `access: ${str(h.access_status, 40)}` : '',
      h.permit_required ? `permit required${h.permit_cost ? ` (${str(h.permit_cost, 40)})` : ''}` : '',
      minerals ? `minerals: ${minerals}` : '',
      str(h.collecting_rules || h.rules, 300),
    ].filter(Boolean).join('. '),
    route: `/explore?hotspot=${str(h.id, 64)}`,
  };
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function buildVault(
  { specimens = [], logs = [], capsules = [], hotspots = [] }: { specimens?: Row[]; logs?: Row[]; capsules?: Row[]; hotspots?: Row[] },
  location: { lat: number; lng: number } | null = null,
): VaultItem[] {
  const nearby = hotspots
    .filter((h) => typeof h.lat === 'number' && typeof h.lng === 'number')
    .map((h) => ({ h, d: location ? haversineKm(location, { lat: h.lat as number, lng: h.lng as number }) : null }))
    .sort((a, b) => (a.d ?? 0) - (b.d ?? 0))
    .slice(0, location ? 8 : 0);

  const items: Omit<VaultItem, 'key'>[] = [
    ...specimens.map(specimenItem),
    ...logs.map(logItem),
    ...capsules.map(capsuleItem),
    ...nearby.map(({ h, d }) => siteItem(h, d)),
  ].filter((i) => i.id);

  return items.map((item, i) => ({ ...item, key: `S${i + 1}` }));
}

/** Records the question is about, best first. */
export function retrieve(vault: VaultItem[], query: string, k = MAX_RECORDS): VaultItem[] {
  const q = tokenize(query);
  const qText = ` ${q.join(' ')} `;
  const wantsRecent = RECENCY.test(query);
  const newest = [...vault].filter((v) => v.type !== 'site').sort((a, b) => b.date.localeCompare(a.date));
  const recentRank = new Map(newest.slice(0, 5).map((v, i) => [v.key, 5 - i]));

  const scored = vault.map((item) => {
    const label = tokenize(item.label);
    const place = tokenize(item.place);
    const body = tokenize(`${item.text} ${item.rarity} ${item.type}`);
    let score = 0;
    for (const w of q) {
      if (label.includes(w)) score += 3;
      else if (place.includes(w)) score += 2;
      else if (body.includes(w)) score += 1;
    }
    // Whole multi-word names ("lake superior agate") count extra.
    const labelPhrase = label.join(' ');
    if (label.length > 1 && qText.includes(` ${labelPhrase} `)) score += 4;
    if (wantsRecent) score += recentRank.get(item.key) || 0;
    return { item, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.item.date.localeCompare(a.item.date))
    .slice(0, k)
    .map((s) => s.item);
}

/** Collection-wide facts, so "how many agates do I have" is answerable. */
export function summarize(vault: VaultItem[]): string {
  const finds = vault.filter((v) => v.type === 'specimen');
  if (!finds.length) return 'The hunter has no specimens logged yet.';
  const count = (key: (v: VaultItem) => string) => {
    const m = new Map<string, number>();
    for (const v of finds) {
      const k = key(v);
      if (k) m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const minerals = count((v) => v.label).slice(0, 8).map(([k, n]) => `${k} ×${n}`).join(', ');
  const rarity = count((v) => v.rarity).map(([k, n]) => `${k} ${n}`).join(', ');
  const places = count((v) => v.place).slice(0, 5).map(([k, n]) => `${k} (${n})`).join(', ');
  const latest = [...finds].sort((a, b) => b.date.localeCompare(a.date))[0];
  return [
    `${finds.length} specimens logged.`,
    minerals && `Most logged: ${minerals}.`,
    rarity && `By rarity: ${rarity}.`,
    places && `Top localities: ${places}.`,
    latest && `Latest find: ${latest.label}${latest.place ? ` at ${latest.place}` : ''}${latest.date ? ` on ${latest.date}` : ''}.`,
  ].filter(Boolean).join(' ');
}

export function formatRecords(items: VaultItem[]): string {
  return items
    .map((v) => {
      const bits = [
        `[${v.key}] ${v.type}: ${v.label}`,
        v.rarity && `rarity ${v.rarity}`,
        v.place && `at ${v.place}`,
        v.date && `on ${v.date}`,
      ].filter(Boolean).join(' — ');
      return v.text ? `${bits}. ${str(v.text, 360)}` : bits;
    })
    .join('\n');
}

export function publicSource(v: VaultItem) {
  return { key: v.key, type: v.type, id: v.id, label: v.label, place: v.place || null, route: v.route };
}

const PRICE = /(\$\s?\d[\d,.]*|\b\d[\d,.]*\s?(?:dollars|usd|bucks)\b)/i;

/**
 * Drop sentences that quote a price nothing supports. A price is supported
 * when the same figure appears in the records Clover was given, or when the
 * turn used live web research.
 */
export function guardPrices(reply: string, supportText: string, researched: boolean): { reply: string; removed: number } {
  if (researched || !PRICE.test(reply)) return { reply, removed: 0 };
  const support = supportText.replace(/[\s,$]/g, '').toLowerCase();
  const sentences = reply.match(/[^.!?]+[.!?]*/g) || [reply];
  let removed = 0;
  const kept = sentences.filter((s) => {
    const m = s.match(PRICE);
    if (!m) return true;
    const figure = m[0].replace(/[^\d.]/g, '');
    if (figure && support.includes(figure)) return true;
    removed += 1;
    return false;
  });
  const out = kept.join(' ').replace(/\s+/g, ' ').trim();
  return {
    reply: out || "I don't have a price logged for that — a sold-comps search would settle it.",
    removed,
  };
}
