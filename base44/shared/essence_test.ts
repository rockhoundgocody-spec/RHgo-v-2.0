import { assertEquals, assert } from 'jsr:@std/assert@1';
import { computeEssence, ENTROPY_TRIGGER_BITS } from './essence.ts';

Deno.test('essence: empty candidate set is inert, never throws', () => {
  const r = computeEssence({ candidates: [] });
  assertEquals(r.entropy_bits, 0);
  assertEquals(r.tier2_triggered, false);
  assertEquals(r.top, null);
});

Deno.test('essence: candidates without a name are discarded', () => {
  const r = computeEssence({ candidates: [{ confidence: 0.9 }, { name: 'Quartz', confidence: 0.5 }] });
  assertEquals(r.posterior.length, 1);
  assertEquals(r.top?.name, 'Quartz');
});

Deno.test('essence: posterior is a normalized probability distribution', () => {
  const r = computeEssence({
    candidates: [
      { name: 'Quartz', confidence: 0.6 },
      { name: 'Calcite', confidence: 0.3 },
      { name: 'Datolite', confidence: 0.1 },
    ],
  });
  const total = r.posterior.reduce((s, p) => s + p.probability, 0);
  assert(Math.abs(total - 1) < 0.01, `posterior sums to ${total}, expected ~1`);
  assertEquals(r.top?.name, 'Quartz');
});

Deno.test('essence: a confident single candidate has near-zero entropy', () => {
  const r = computeEssence({ candidates: [{ name: 'Quartz', confidence: 0.99 }] });
  assertEquals(r.entropy_bits, 0);
  assertEquals(r.tier2_triggered, false);
});

Deno.test('essence: ambiguous spread crosses the tier-2 entropy trigger', () => {
  // Four equally likely candidates → H = log2(4) = 2 bits > 1.2
  const r = computeEssence({
    candidates: [
      { name: 'A', confidence: 0.25 }, { name: 'B', confidence: 0.25 },
      { name: 'C', confidence: 0.25 }, { name: 'D', confidence: 0.25 },
    ],
  });
  assert(r.entropy_bits > ENTROPY_TRIGGER_BITS, `entropy ${r.entropy_bits} should exceed trigger`);
  assertEquals(r.tier2_triggered, true);
});

Deno.test('essence: spatial + diagnostic likelihoods can overturn the visual leader', () => {
  const r = computeEssence({
    candidates: [{ name: 'Quartz', confidence: 0.6 }, { name: 'Datolite', confidence: 0.4 }],
    locationLikelihoods: { Datolite: 8 },   // Keweenaw beach strongly favors datolite
    diagnosticLikelihoods: { Datolite: 2 }, // hardness test agrees
  });
  assertEquals(r.top?.name, 'Datolite');
});

Deno.test('essence: zero/undefined confidence is floored, never produces NaN', () => {
  const r = computeEssence({ candidates: [{ name: 'A', confidence: 0 }, { name: 'B' }] });
  for (const p of r.posterior) {
    assert(Number.isFinite(p.probability), `${p.name} produced ${p.probability}`);
  }
  assert(Number.isFinite(r.entropy_bits));
});