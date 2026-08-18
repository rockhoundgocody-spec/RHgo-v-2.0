import { assertEquals } from "jsr:@std/assert@1";

Deno.test("syncStatsToSheets: computes daily stats aggregation accurately", () => {
  const today = new Date().toISOString().slice(0, 10);
  const specimens = [
    { created_date: `${today}T10:00:00Z`, mineral_name: 'Quartz', rarity: 'common' },
    { created_date: `${today}T11:00:00Z`, mineral_name: 'Quartz ', rarity: 'common' },
    { created_date: '2025-01-01T00:00:00Z', mineral_name: 'Amethyst', rarity: 'rare' },
    { created_date: `${today}T12:00:00Z`, mineral_name: 'Gold', rarity: 'legendary' },
  ];

  const hotspots = [{ id: 'h1' }, { id: 'h2' }];
  const profiles = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }];

  const specimensToday = specimens.filter(s => (s.created_date || '').slice(0, 10) === today).length;

  const mineralCounts: Record<string, number> = {};
  const rarityCounts: Record<string, number> = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
  for (const s of specimens) {
    const name = (s.mineral_name || 'Unknown').trim();
    mineralCounts[name] = (mineralCounts[name] || 0) + 1;
    if (rarityCounts[s.rarity] != null) rarityCounts[s.rarity]++;
  }

  const topMinerals = Object.entries(mineralCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, count]) => [name, String(count)]);

  assertEquals(specimensToday, 3);
  assertEquals(profiles.length, 3);
  assertEquals(hotspots.length, 2);
  assertEquals(specimens.length, 4);
  assertEquals(rarityCounts.common, 2);
  assertEquals(rarityCounts.rare, 1);
  assertEquals(rarityCounts.legendary, 1);
  assertEquals(topMinerals[0], ['Quartz', '2']);
});
