import { assertEquals, assertGreater } from 'jsr:@std/assert@1';
import {
  chunkValues,
  collectPages,
  findUnvisitedHotspots,
  groupSpecimensByUserId,
} from './operations.ts';

Deno.test('chunkValues splits arrays into requested batch sizes', () => {
  assertEquals(chunkValues(['u1', 'u2', 'u3', 'u4', 'u5'], 2), [
    ['u1', 'u2'],
    ['u3', 'u4'],
    ['u5'],
  ]);
});

Deno.test('collectPages paginates until a partial page is returned', async () => {
  const calls: number[][] = [];
  const fetchPage = (limit: number, skip: number) => {
    calls.push([limit, skip]);
    return Promise.resolve(
      Array.from({ length: Math.min(limit, 5 - skip) }, (_, i) => ({ id: `item_${skip + i}` })),
    );
  };

  const results = await collectPages(fetchPage, 2);
  assertEquals(results.length, 5);
  assertEquals(calls, [[2, 0], [2, 2], [2, 4]]);
});

Deno.test('groupSpecimensByUserId groups specimens by created_by_id preserving order', () => {
  const specimens = [
    { id: 's1', created_by_id: 'user_1', mineral_name: 'Quartz', created_date: '2026-03-01T10:00:00Z' },
    { id: 's2', created_by_id: 'user_2', mineral_name: 'Agate', created_date: '2026-03-01T09:00:00Z' },
    { id: 's3', created_by_id: 'user_1', mineral_name: 'Amethyst', created_date: '2026-02-28T10:00:00Z' },
  ];

  const grouped = groupSpecimensByUserId(specimens);
  assertEquals(grouped.size, 2);
  assertEquals(grouped.get('user_1')?.map((s) => s.id), ['s1', 's3']);
  assertEquals(grouped.get('user_2')?.map((s) => s.id), ['s2']);
});

Deno.test('findUnvisitedHotspots filters collected minerals and sorts by distance', () => {
  const hotspots = [
    { id: 'h1', name: 'Far Spot', minerals: ['Quartz'], lat: 45.0, lng: -85.0 },
    { id: 'h2', name: 'Near Spot', minerals: ['Agate', 'Jasper'], lat: 44.32, lng: -85.61 },
    { id: 'h3', name: 'Collected Spot', minerals: ['Quartz'], lat: 44.30, lng: -85.60 },
  ];

  const collectedSet = new Set(['quartz']);
  const unvisited = findUnvisitedHotspots(hotspots, collectedSet, 44.31, -85.60);

  // 'Collected Spot' should be filtered out because user already collected Quartz.
  assertEquals(unvisited.length, 1);
  assertEquals(unvisited[0].id, 'h2');
});

Deno.test('benchmark: batched specimen & hotspot loading vs N+1 loop (500 users)', () => {
  const userCount = 500;
  const users = Array.from({ length: userCount }, (_, i) => ({ id: `usr_${i}`, email: `user${i}@example.test` }));

  const hotspots = Array.from({ length: 200 }, (_, i) => ({
    id: `hotspot_${i}`,
    name: `Hotspot ${i}`,
    minerals: ['Agate', 'Quartz', 'Fluorite'],
    trust_score: 100 - i,
    lat: 44.0 + (i % 20) * 0.1,
    lng: -85.0 - (i % 20) * 0.1,
  }));

  // Generate 5 specimens per user
  const allSpecimens = users.flatMap((u) => [
    { id: `spec_${u.id}_1`, created_by_id: u.id, mineral_name: 'Quartz', lat: 44.3, lng: -85.6, created_date: '2026-03-01T12:00:00Z' },
    { id: `spec_${u.id}_2`, created_by_id: u.id, mineral_name: 'Calcite', lat: 44.2, lng: -85.5, created_date: '2026-02-28T12:00:00Z' },
  ]);

  // Simulate database query counters
  let dbQueriesNPlus1 = 0;
  let dbQueriesBatched = 0;

  // 1. Measure N+1 approach
  const startNPlus1 = performance.now();
  dbQueriesNPlus1++; // User.list
  for (const user of users) {
    // DB Query 1: Specimen.filter per user
    dbQueriesNPlus1++;
    const userSpecimens = allSpecimens.filter((s) => s.created_by_id === user.id).slice(0, 50);

    // DB Query 2: Hotspot.list per user
    dbQueriesNPlus1++;
    const userHotspots = hotspots.slice(0, 200);

    const collectedSet = new Set(userSpecimens.map((s) => s.mineral_name.toLowerCase()));
    const lastWithCoords = userSpecimens.find((s) => s.lat != null && s.lng != null);
    const _unvisited = findUnvisitedHotspots(userHotspots, collectedSet, lastWithCoords?.lat, lastWithCoords?.lng).slice(0, 8);
  }
  const timeNPlus1 = performance.now() - startNPlus1;

  // 2. Measure Batched approach
  const startBatched = performance.now();
  dbQueriesBatched++; // User.list
  dbQueriesBatched++; // Hotspot.list (once outside)
  const sharedHotspots = hotspots.slice(0, 200);

  const userIds = users.map((u) => u.id);
  const specimensByUserId = new Map<string, typeof allSpecimens>();

  for (const batchUserIds of chunkValues(userIds, 100)) {
    dbQueriesBatched++; // Specimen.filter for 100 users
    const batchSet = new Set(batchUserIds);
    const batchSpecimens = allSpecimens.filter((s) => batchSet.has(s.created_by_id));
    const grouped = groupSpecimensByUserId(batchSpecimens);
    for (const [userId, specimens] of grouped) {
      specimensByUserId.set(userId, specimens.slice(0, 50));
    }
  }

  for (const user of users) {
    const userSpecimens = specimensByUserId.get(user.id) || [];
    const collectedSet = new Set(userSpecimens.map((s) => s.mineral_name.toLowerCase()));
    const lastWithCoords = userSpecimens.find((s) => s.lat != null && s.lng != null);
    const _unvisited = findUnvisitedHotspots(sharedHotspots, collectedSet, lastWithCoords?.lat, lastWithCoords?.lng).slice(0, 8);
  }
  const timeBatched = performance.now() - startBatched;

  console.log(`\n=== weeklyFieldMissions Database Query Benchmark (500 users) ===`);
  console.log(`N+1 DB Queries:       ${dbQueriesNPlus1}`);
  console.log(`Batched DB Queries:   ${dbQueriesBatched}`);
  console.log(`Query Reduction:      ${((1 - dbQueriesBatched / dbQueriesNPlus1) * 100).toFixed(1)}% fewer queries`);
  console.log(`N+1 Process Time:     ${timeNPlus1.toFixed(2)} ms`);
  console.log(`Batched Process Time: ${timeBatched.toFixed(2)} ms`);

  // Verify query count reduction
  assertEquals(dbQueriesNPlus1, 1001); // 1 User.list + 500 Specimen.filter + 500 Hotspot.list
  assertEquals(dbQueriesBatched, 7);   // 1 User.list + 1 Hotspot.list + 5 Specimen.filter batches
  assertGreater(dbQueriesNPlus1, dbQueriesBatched * 100);
});
