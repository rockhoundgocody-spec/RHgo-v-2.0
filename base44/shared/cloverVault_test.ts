import { assert, assertEquals } from 'jsr:@std/assert@1';
import { buildVault, formatRecords, guardPrices, retrieve, summarize, tokenize } from './cloverVault.ts';

const specimens = [
  { id: 'a1', mineral_name: 'Lake Superior Agate', found_at: 'Grand Marais, MN', found_date: '2026-08-02', rarity: 'uncommon', notes: 'Fortification banding, carnelian red.' },
  { id: 'a2', mineral_name: 'Barite', found_at: 'Sweetwater wash, WY', found_date: '2026-09-20', rarity: 'common', notes: 'Bladed crystals on matrix. Sold a similar plate for $40.' },
  { id: 'a3', mineral_name: 'Native Copper', found_at: 'Keweenaw, MI', found_date: '2026-07-11', rarity: 'rare', notes: 'Dendritic.' },
  { id: 'a4', mineral_name: 'Lake Superior Agate', found_at: 'Two Harbors, MN', found_date: '2026-06-01', rarity: 'uncommon' },
];
const logs = [{ id: 'l1', mineral_name: 'Petoskey Stone', location_label: 'Petoskey State Park', found_date: '2026-09-24', notes: 'Wet only.' }];
const hotspots = [
  { id: 'h1', name: 'Eagle River Beach', lat: 47.41, lng: -88.29, state: 'MI', minerals: ['Lake Superior Agate', 'Native Copper'], access_status: 'public' },
  { id: 'h2', name: 'Far Away Wash', lat: 33.4, lng: -112.0, state: 'AZ', minerals: ['Fire Agate'] },
];

Deno.test('tokenize drops filler and folds simple plurals', () => {
  assertEquals(tokenize('Hey Clover, where did I find my agates?'), ['agate']);
});

Deno.test('vault keys every record and routes it', () => {
  const v = buildVault({ specimens, logs, hotspots }, { lat: 47.4, lng: -88.3 });
  assertEquals(v.map((x) => x.key).slice(0, 3), ['S1', 'S2', 'S3']);
  assertEquals(v[0].route, '/specimen/a1');
  const site = v.find((x) => x.type === 'site' && x.id === 'h1');
  assert(site && site.route === '/explore?hotspot=h1');
  assert(site.text.includes('km away'));
});

Deno.test('no location means no site records', () => {
  const v = buildVault({ specimens, hotspots });
  assertEquals(v.filter((x) => x.type === 'site').length, 0);
});

Deno.test('retrieve finds records by mineral and by place', () => {
  const v = buildVault({ specimens, logs });
  assertEquals(retrieve(v, 'pull my Sweetwater barite')[0].id, 'a2');
  const agates = retrieve(v, 'how many lake superior agates do I have').map((x) => x.id);
  assertEquals(agates.slice(0, 2).sort(), ['a1', 'a4']);
  assertEquals(retrieve(v, 'what about the keweenaw')[0].id, 'a3');
});

Deno.test('recency questions surface the newest records', () => {
  const v = buildVault({ specimens, logs });
  assertEquals(retrieve(v, 'what was my last find')[0].id, 'l1');
});

Deno.test('unrelated questions retrieve nothing', () => {
  const v = buildVault({ specimens, logs });
  assertEquals(retrieve(v, 'will it rain tomorrow').length, 0);
});

Deno.test('summary counts the collection', () => {
  const s = summarize(buildVault({ specimens }));
  assert(s.startsWith('4 specimens logged.'));
  assert(s.includes('Lake Superior Agate ×2'));
  assert(s.includes('Latest find: Barite at Sweetwater wash, WY on 2026-09-20.'));
  assertEquals(summarize([]), 'The hunter has no specimens logged yet.');
});

Deno.test('records are formatted with citation keys', () => {
  const text = formatRecords(buildVault({ specimens: [specimens[1]] }));
  assert(text.startsWith('[S1] specimen: Barite — rarity common — at Sweetwater wash, WY — on 2026-09-20.'));
});

Deno.test('unsupported prices are removed, supported ones kept', () => {
  const invented = guardPrices('Nice barite. That plate is worth about $400. Keep it dry.', 'Bladed crystals', false);
  assertEquals(invented.removed, 1);
  assertEquals(invented.reply, 'Nice barite. Keep it dry.');

  const supported = guardPrices('You sold a similar plate for $40.', 'Sold a similar plate for $40.', false);
  assertEquals(supported.removed, 0);

  const researched = guardPrices('Comps run $30 to $60.', '', true);
  assertEquals(researched.removed, 0);

  const onlyPrice = guardPrices('Easily 300 dollars.', '', false);
  assertEquals(onlyPrice.reply, "I don't have a price logged for that — a sold-comps search would settle it.");
});
