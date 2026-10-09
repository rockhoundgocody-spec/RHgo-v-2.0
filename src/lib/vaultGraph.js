/**
 * vaultGraph — turns a hunter's records into the Vault Galaxy.
 *
 *   species  (hub star, one per mineral)   ← find / log orbit it
 *   site     (belt star, one per locality) ← finds, logs and trips link to it
 *
 * Species cluster into constellations by mineral class (silicates, sulfides,
 * native elements …), each class its own color. Sites ride an outer belt, so
 * the links from a constellation to the places it came from cross the sky.
 *
 * The layout is analytic and seeded from record ids: instant (no physics
 * pass), stable between visits, and identical on every device.
 * Pure — no DOM, no three.js — so it's unit-tested.
 */

export const MINERAL_GROUPS = [
  { id: 'silicate', label: 'Silicates', color: '#a78bfa' },
  { id: 'native', label: 'Native elements', color: '#fb923c' },
  { id: 'sulfide', label: 'Sulfides', color: '#facc15' },
  { id: 'oxide', label: 'Oxides', color: '#fb7185' },
  { id: 'carbonate', label: 'Carbonates', color: '#2dd4bf' },
  { id: 'sulfate', label: 'Sulfates', color: '#e5e7eb' },
  { id: 'halide', label: 'Halides', color: '#38bdf8' },
  { id: 'phosphate', label: 'Phosphates', color: '#4ade80' },
  { id: 'organic', label: 'Fossils & organics', color: '#f59e0b' },
  { id: 'rock', label: 'Rocks', color: '#94a3b8' },
  { id: 'other', label: 'Unsorted', color: '#64748b' },
];
export const SITE_COLOR = '#67e8f9';
export const TRIP_COLOR = '#f0abfc';

const GROUP_BY_ID = Object.fromEntries(MINERAL_GROUPS.map((g) => [g.id, g]));

// Most specific first: "Native Copper with Limonite" is a native element,
// "Petoskey stone" a fossil, not a rock.
const GROUP_PATTERNS = [
  ['organic', /\b(fossil|petoskey|charlevoix|amber|jet|petrified|coral|ammonite|trilobite|crinoid|brachiopod|pearl|copal|bone)\b/],
  ['native', /\b(native|copper|gold|silver|sulfur|sulphur|graphite|diamond|platinum|bismuth|iron meteorite)\b/],
  ['sulfide', /\b(pyrite|marcasite|galena|sphalerite|chalcopyrite|cinnabar|bornite|molybdenite|arsenopyrite|stibnite|realgar|orpiment|chalcocite|covellite)\b/],
  ['sulfate', /\b(gypsum|selenite|satin spar|desert rose|barite|baryte|celestine|celestite|anhydrite|alabaster|anglesite)\b/],
  ['halide', /\b(fluorite|halite|sylvite|cryolite)\b/],
  ['phosphate', /\b(apatite|turquoise|variscite|vivianite|wavellite|pyromorphite|autunite|lazulite|amblygonite)\b/],
  ['carbonate', /\b(calcite|dolomite|aragonite|malachite|azurite|rhodochrosite|siderite|smithsonite|cerussite|magnesite|travertine)\b/],
  ['oxide', /\b(hematite|magnetite|corundum|ruby|sapphire|rutile|goethite|limonite|cassiterite|chromite|spinel|cuprite|psilomelane|pyrolusite|ilmenite|tiger ?eye)\b/],
  ['silicate', /\b(quartz|amethyst|citrine|agate|chalcedony|jasper|carnelian|onyx|opal|flint|chert|feldspar|labradorite|moonstone|microcline|orthoclase|garnet|tourmaline|beryl|emerald|aquamarine|epidote|prehnite|thomsonite|chlorastrolite|greenstone|olivine|peridot|topaz|zircon|mica|muscovite|biotite|jade|jadeite|nephrite|serpentine|kyanite|staurolite|datolite|zeolite|natrolite|stilbite|chrysocolla|unakite|sodalite|lapis|rhodonite|sugilite|thunder ?egg|geode)\b/],
  ['rock', /\b(basalt|granite|obsidian|rhyolite|andesite|sandstone|limestone|quartzite|gneiss|schist|slate|pumice|conglomerate|pudding ?stone|diorite|gabbro|shale|marble|syenite|yooperlite|tuff|breccia|scoria)\b/],
];

export function classifyMineral(name) {
  const n = String(name || '').toLowerCase();
  for (const [group, re] of GROUP_PATTERNS) if (re.test(n)) return group;
  return 'other';
}

/** "Native Copper with Limonite (Keweenaw)" → "native copper" */
export function speciesKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/\s+(with|on|in|and)\s+.*$/, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function placeKey(place) {
  return String(place || '').toLowerCase().replace(/[^a-z0-9\s,]/g, ' ').replace(/\s+/g, ' ').trim();
}

const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

// ── Seeded randomness (stable per record) ───────────────────────────────────
export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed) {
  let a = seed || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** i-th of n points spread evenly over a unit sphere. */
function fibonacciPoint(i, n) {
  if (n <= 1) return [0, 0, 0];
  const y = 1 - (i / (n - 1)) * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = i * Math.PI * (3 - Math.sqrt(5));
  return [Math.cos(theta) * r, y, Math.sin(theta) * r];
}

const RARITY_SCALE = { common: 1, uncommon: 1.15, rare: 1.35, legendary: 1.6 };

/**
 * Build the galaxy from raw entity rows.
 * @returns {{ nodes: Array, links: Array, groups: Array, byRef: Map, stats: object }}
 */
export function buildGalaxy({ specimens = [], logs = [], capsules = [] } = {}) {
  const nodes = [];
  const links = [];
  const byId = new Map();
  const add = (node) => {
    if (byId.has(node.id)) return byId.get(node.id);
    byId.set(node.id, node);
    nodes.push(node);
    return node;
  };
  const link = (a, b, kind) => { if (a && b && a !== b) links.push({ source: a.id, target: b.id, kind }); };

  const speciesNode = (name) => {
    const key = speciesKey(name);
    if (!key) return null;
    const group = classifyMineral(name);
    return add({
      id: `species:${key}`, kind: 'species', label: titleCase(key), group,
      color: GROUP_BY_ID[group].color, count: 0, refId: null, route: null,
    });
  };
  const siteNode = (place) => {
    const key = placeKey(place);
    if (!key) return null;
    return add({
      id: `site:${key}`, kind: 'site', label: String(place).trim().slice(0, 80), group: 'site',
      color: SITE_COLOR, count: 0, refId: null, route: null,
    });
  };

  for (const s of specimens) {
    if (!s?.id) continue;
    const species = speciesNode(s.mineral_name || s.common_name);
    const site = siteNode(s.found_at);
    const group = species?.group || 'other';
    const find = add({
      id: `find:${s.id}`, kind: 'find', refId: s.id, label: s.mineral_name || s.common_name || 'Unnamed find',
      group, color: GROUP_BY_ID[group].color, rarity: s.rarity || 'common',
      place: s.found_at || '', date: String(s.found_date || s.created_date || '').slice(0, 10),
      image: s.image_url || null, notes: s.notes || '', route: `/specimen/${s.id}`,
      parent: species?.id || site?.id || null,
    });
    if (species) { species.count += 1; link(find, species, 'species'); }
    if (site) { site.count += 1; link(find, site, 'site'); }
  }

  for (const l of logs) {
    if (!l?.id) continue;
    const species = speciesNode(l.mineral_name);
    const site = siteNode(l.location_label);
    const group = species?.group || 'other';
    const node = add({
      id: `log:${l.id}`, kind: 'log', refId: l.id, label: l.mineral_name || 'Field note',
      group, color: GROUP_BY_ID[group].color, rarity: l.rarity || 'common',
      place: l.location_label || '', date: String(l.found_date || l.created_date || '').slice(0, 10),
      image: l.image_uri ? null : l.image_url || null, privatePhoto: !!l.image_uri, notes: l.notes || '', route: '/private-log',
      parent: species?.id || site?.id || null,
    });
    if (species) { species.count += 1; link(node, species, 'species'); }
    if (site) { site.count += 1; link(node, site, 'site'); }
  }

  for (const c of capsules) {
    if (!c?.id) continue;
    const site = siteNode(c.location_name);
    const node = add({
      id: `trip:${c.id}`, kind: 'trip', refId: c.id, label: c.expedition_name || 'Expedition',
      group: 'trip', color: TRIP_COLOR, place: c.location_name || '',
      date: String(c.expedition_date || c.created_date || '').slice(0, 10),
      notes: c.story || '', route: '/expeditions', parent: site?.id || null,
    });
    if (site) { site.count += 1; link(node, site, 'trip'); }
  }

  layoutGalaxy(nodes);

  const groupCounts = new Map();
  for (const n of nodes) if (n.kind === 'find' || n.kind === 'log') groupCounts.set(n.group, (groupCounts.get(n.group) || 0) + 1);
  const groups = MINERAL_GROUPS.filter((g) => groupCounts.has(g.id)).map((g) => ({ ...g, count: groupCounts.get(g.id) }));

  const byRef = new Map(nodes.filter((n) => n.refId).map((n) => [n.refId, n.id]));
  return {
    nodes,
    links,
    groups,
    byRef,
    stats: {
      finds: nodes.filter((n) => n.kind === 'find').length,
      species: nodes.filter((n) => n.kind === 'species').length,
      sites: nodes.filter((n) => n.kind === 'site').length,
    },
  };
}

// ── Layout ──────────────────────────────────────────────────────────────────
const GROUP_RADIUS = 58;
const BELT_RADIUS = 92;

export function layoutGalaxy(nodes) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const species = nodes.filter((n) => n.kind === 'species');
  const sites = nodes.filter((n) => n.kind === 'site');

  // Constellation centers: one per mineral class present, biggest first.
  const groupOrder = [...new Set(species.sort((a, b) => b.count - a.count).map((s) => s.group))];
  const groupCenter = new Map(groupOrder.map((g, i) => {
    const [x, y, z] = fibonacciPoint(i, Math.max(groupOrder.length, 2));
    const r = groupOrder.length === 1 ? 0 : GROUP_RADIUS;
    return [g, [x * r, y * r * 0.62, z * r]];
  }));

  // Species hubs on a small sphere around their constellation center.
  for (const g of groupOrder) {
    const members = species.filter((s) => s.group === g).sort((a, b) => a.id.localeCompare(b.id));
    const [cx, cy, cz] = groupCenter.get(g);
    const r = members.length === 1 ? 0 : 7 + 2.4 * Math.sqrt(members.length);
    members.forEach((s, i) => {
      const [x, y, z] = fibonacciPoint(i, members.length);
      s.position = [cx + x * r, cy + y * r, cz + z * r];
      s.size = 11 + Math.min(10, Math.sqrt(s.count) * 2.6);
    });
  }

  // Sites ride a slightly tilted outer belt.
  const orderedSites = [...sites].sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
  orderedSites.forEach((s, i) => {
    const rand = rng(hashString(s.id));
    const angle = (i / Math.max(orderedSites.length, 1)) * Math.PI * 2 + rand() * 0.25;
    const radius = BELT_RADIUS + (rand() - 0.5) * 10;
    s.position = [Math.cos(angle) * radius, (rand() - 0.5) * 14 + Math.sin(angle) * 9, Math.sin(angle) * radius];
    s.size = 10 + Math.min(8, Math.sqrt(s.count) * 2.2);
  });

  // Finds, logs and trips orbit their parent on a golden spiral shell.
  const children = new Map();
  for (const n of nodes) {
    if (n.kind === 'species' || n.kind === 'site') continue;
    const key = n.parent && byId.has(n.parent) ? n.parent : '__loose__';
    if (!children.has(key)) children.set(key, []);
    children.get(key).push(n);
  }
  for (const [parentId, kids] of children) {
    const parent = byId.get(parentId);
    const [px, py, pz] = parent?.position || [0, -34, 0];
    kids.sort((a, b) => a.id.localeCompare(b.id));
    const shell = 3.2 + 0.55 * Math.sqrt(kids.length) + (parent?.kind === 'site' ? 2.5 : 0);
    kids.forEach((n, i) => {
      const rand = rng(hashString(n.id));
      const [x, y, z] = fibonacciPoint(i, Math.max(kids.length, 2));
      const r = shell * (0.85 + rand() * 0.3);
      n.position = [px + x * r, py + y * r, pz + z * r];
      const base = n.kind === 'trip' ? 9 : n.kind === 'log' ? 6 : 7.5;
      n.size = base * (RARITY_SCALE[n.rarity] || 1);
    });
  }
  return nodes;
}

// ── Search ──────────────────────────────────────────────────────────────────
const STOP = new Set(['the', 'my', 'a', 'an', 'of', 'at', 'from', 'in', 'on', 'pull', 'show', 'open', 'find', 'up', 'me', 'clover', 'hey']);

function words(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => (w.length > 4 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w));
}

/** Nodes matching a query, best first (label beats place beats class). */
export function searchGalaxy(nodes, query) {
  const q = words(query);
  if (!q.length) return [];
  const groupLabel = Object.fromEntries(MINERAL_GROUPS.map((g) => [g.id, g.label]));
  const scored = [];
  for (const n of nodes) {
    const label = words(n.label);
    const place = words(n.place);
    const cls = words(groupLabel[n.group] || '');
    let score = 0;
    let hits = 0;
    for (const w of q) {
      const hit = label.includes(w) ? 3 : place.includes(w) ? 2 : cls.includes(w) ? 1 : 0;
      if (hit) { score += hit; hits += 1; }
    }
    if (!hits) continue;
    // Prefer records that match every word, then real finds over hubs.
    if (hits === q.length) score += 3;
    if (n.kind === 'find' || n.kind === 'log') score += 0.5;
    scored.push({ n, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.n);
}

// ── Sample vault (shown until the hunter logs a find) ───────────────────────
const SAMPLE = [
  ['Lake Superior Agate', 'Grand Marais, MN', 'uncommon'], ['Lake Superior Agate', 'Two Harbors, MN', 'uncommon'],
  ['Thomsonite', 'Grand Marais, MN', 'rare'], ['Native Copper', 'Keweenaw Peninsula, MI', 'uncommon'],
  ['Datolite', 'Keweenaw Peninsula, MI', 'rare'], ['Chlorastrolite', 'Isle Royale, MI', 'legendary'],
  ['Petoskey Stone', 'Petoskey State Park, MI', 'common'], ['Leland Blue', 'Leland, MI', 'uncommon'],
  ['Barite', 'Sweetwater Wash, WY', 'common'], ['Jade (Nephrite)', 'Sweetwater Wash, WY', 'rare'],
  ['Fire Agate', 'Opal Butte, OR', 'rare'], ['Thunder Egg', 'Priday Beds, OR', 'uncommon'],
  ['Obsidian', 'Glass Buttes, OR', 'common'], ['Quartz', 'Mount Ida, AR', 'common'],
  ['Quartz', 'Mount Ida, AR', 'uncommon'], ['Wavellite', 'Mount Ida, AR', 'rare'],
  ['Pyrite', 'Rico, CO', 'common'], ['Rhodochrosite', 'Alma, CO', 'legendary'],
  ['Fluorite', 'Cave-in-Rock, IL', 'uncommon'], ['Geode', 'Keokuk, IA', 'common'],
  ['Selenite', 'Great Salt Plains, OK', 'common'], ['Turritella Agate', 'Delaney Rim, WY', 'uncommon'],
];

export function sampleGalaxy() {
  const specimens = SAMPLE.map(([mineral_name, found_at, rarity], i) => ({
    id: `sample-${i + 1}`, mineral_name, found_at, rarity,
    found_date: `2026-0${1 + (i % 9)}-${String(10 + (i % 18)).padStart(2, '0')}`,
    notes: 'Sample record — log your own finds to replace these.',
  }));
  return buildGalaxy({ specimens });
}