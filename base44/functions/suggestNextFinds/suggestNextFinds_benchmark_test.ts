import { assertEquals } from 'jsr:@std/assert@1';

Deno.test('uncollected minerals benchmark: loop vs flatMap', () => {
  const nearby = Array.from({ length: 8 }, (_, i) => ({
    name: `Hotspot ${i}`,
    minerals: [`Mineral_${i}_A`, `Mineral_${i}_B`, `Mineral_Common_1`, `Mineral_Common_2`],
  }));

  const collection: Record<string, number> = {
    'Mineral_0_A': 1,
    'Mineral_Common_1': 2,
  };

  const iterations = 100_000;

  // 1. Current loop implementation
  const startLoop = performance.now();
  let resultLoop: string[] = [];
  for (let iter = 0; iter < iterations; iter++) {
    const nearbyMinerals = new Set<string>();
    for (const h of nearby) {
      for (const m of h.minerals) nearbyMinerals.add(m);
    }
    resultLoop = [...nearbyMinerals].filter(m => !collection[m]);
  }
  const durLoop = performance.now() - startLoop;

  // 2. FlatMap implementation
  const startFlatMap = performance.now();
  let resultFlatMap: string[] = [];
  for (let iter = 0; iter < iterations; iter++) {
    resultFlatMap = [...new Set(nearby.flatMap(h => h.minerals || []))].filter(m => !collection[m]);
  }
  const durFlatMap = performance.now() - startFlatMap;

  assertEquals(resultLoop.sort(), resultFlatMap.sort());

  console.log(`Loop duration (${iterations} iterations): ${durLoop.toFixed(2)}ms`);
  console.log(`FlatMap duration (${iterations} iterations): ${durFlatMap.toFixed(2)}ms`);
  console.log(`Ratio (flatMap/loop): ${(durFlatMap / durLoop).toFixed(2)}x`);
});
