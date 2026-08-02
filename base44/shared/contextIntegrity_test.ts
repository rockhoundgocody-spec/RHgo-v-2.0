import { assertEquals, assert } from 'jsr:@std/assert@1';
import { computeContextIntegrity } from './contextIntegrity.ts';

Deno.test('contextIntegrity: no evidence grades F and caps confidence hard', () => {
  const r = computeContextIntegrity({});
  assertEquals(r.grade, 'F');
  assert(r.confidence_cap <= 0.65, `cap ${r.confidence_cap} too generous for no evidence`);
  assert(r.missing_evidence.length >= 5);
});

Deno.test('contextIntegrity: full evidence grades A and unlocks high confidence', () => {
  const r = computeContextIntegrity({
    imageCount: 4,
    imageQualityScore: 9,
    hasGps: true,
    geologyUnitCount: 2,
    hasLocality: true,
    fieldTestCount: 3,
    conditionKnown: true,
  });
  assertEquals(r.grade, 'A');
  assert(r.confidence_cap >= 0.9, `cap ${r.confidence_cap} too low for complete evidence`);
  assertEquals(r.missing_evidence.length, 0);
});

Deno.test('contextIntegrity: score and cap stay inside their declared bounds', () => {
  const extreme = computeContextIntegrity({
    imageCount: 99, imageQualityScore: 999, hasGps: true, geologyUnitCount: 50,
    hasLocality: true, fieldTestCount: 99, conditionKnown: true,
  });
  assert(extreme.score <= 1, `score ${extreme.score} exceeded 1`);
  assert(extreme.confidence_cap <= 0.95, `cap ${extreme.confidence_cap} exceeded 0.95`);

  const drained = computeContextIntegrity({ contradictionCount: 100 });
  assertEquals(drained.score, 0);
  assert(drained.confidence_cap >= 0.55, 'cap must never fall below the 0.55 floor');
});

Deno.test('contextIntegrity: each contradiction measurably drains the score', () => {
  const base = { imageCount: 3, imageQualityScore: 8, hasGps: true, geologyUnitCount: 1 };
  const clean = computeContextIntegrity(base);
  const conflicted = computeContextIntegrity({ ...base, contradictionCount: 2 });
  assert(conflicted.score < clean.score, 'contradictions must lower the score');
});

Deno.test('contextIntegrity: GPS present but no geology coverage is called out', () => {
  const r = computeContextIntegrity({ hasGps: true, geologyUnitCount: 0 });
  assert(r.missing_evidence.some((m) => m.includes('geological map coverage')));
  assert(!r.missing_evidence.some((m) => m.includes('Enable GPS')));
});

Deno.test('contextIntegrity: unknown image quality is treated as neutral, not zero', () => {
  const unknown = computeContextIntegrity({ imageQualityScore: null });
  const terrible = computeContextIntegrity({ imageQualityScore: 0 });
  assert(unknown.score > terrible.score, 'null quality must not be scored as worst-case');
});