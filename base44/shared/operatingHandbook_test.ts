import { assertEquals, assert } from 'jsr:@std/assert@1';
import { applyHandbook, CERTAINTY_RULES, HANDBOOK_VERSION } from './operatingHandbook.ts';

Deno.test('handbook: unverified confidence is capped at the ceiling', () => {
  const { identification, enforcement } = applyHandbook({ top_match: 'Quartz', confidence: 0.99 }, null);
  assertEquals(identification.confidence, CERTAINTY_RULES.maxUnverifiedConfidence);
  assert(enforcement.rules_applied.includes('confidence_capped_unverified'));
  assertEquals(enforcement.handbook_version, HANDBOOK_VERSION);
});

Deno.test('handbook: 0-100 confidence is normalized to 0-1', () => {
  const { identification } = applyHandbook({ top_match: 'Quartz', confidence: 85 }, null);
  assertEquals(identification.confidence, 0.85);
});

Deno.test('handbook: weak context integrity caps confidence below the model claim', () => {
  const { identification, enforcement } = applyHandbook(
    { top_match: 'Quartz', confidence: 0.9 },
    { score: 0.2, confidence_cap: 0.63 },
  );
  assertEquals(identification.confidence, 0.63);
  assert(enforcement.rules_applied.includes('confidence_capped_low_context'));
  assert(enforcement.rarity_unreliable, 'low context must flag rarity as unreliable');
});

Deno.test('handbook: value estimate is withheld on weak evidence', () => {
  const { identification, enforcement } = applyHandbook(
    { top_match: 'Quartz', confidence: 0.4, value_estimate: '$500-900' },
    null,
  );
  assertEquals(identification.value_estimate, null);
  assert(enforcement.value_withheld);
  assert(enforcement.expert_review_required, 'sub-threshold confidence must route to review');
});

Deno.test('handbook: strong evidence keeps the value estimate and attaches its disclaimer', () => {
  const { identification, enforcement } = applyHandbook(
    { top_match: 'Quartz', confidence: 0.88, value_estimate: '$20-40' },
    { score: 0.9, confidence_cap: 0.95 },
  );
  assertEquals(identification.value_estimate, '$20-40');
  assertEquals(enforcement.value_withheld, false);
  assertEquals(enforcement.expert_review_required, false);
  assert(enforcement.disclaimers.some((d) => d.includes('appraisal')));
});

Deno.test('handbook: hazardous material escalates regardless of which field names it', () => {
  const byName = applyHandbook({ top_match: 'Galena', confidence: 0.85 }, null);
  assert(byName.enforcement.safety_flag);
  assert(byName.enforcement.disclaimers.some((d) => d.includes('hazardous')));

  const byDescription = applyHandbook(
    { top_match: 'Unknown', confidence: 0.85, description: 'Possibly radioactive crust.' },
    null,
  );
  assert(byDescription.enforcement.safety_flag, 'hazard keywords in description must escalate');

  const safe = applyHandbook({ top_match: 'Quartz', confidence: 0.85 }, null);
  assertEquals(safe.enforcement.safety_flag, false);
});

Deno.test('handbook: missing/garbage confidence degrades safely to review, not a crash', () => {
  const { identification, enforcement } = applyHandbook({ top_match: 'Quartz' }, null);
  assertEquals(identification.confidence, 0);
  assert(enforcement.expert_review_required);
});

Deno.test('handbook: legal and identification disclaimers are always present', () => {
  const { enforcement } = applyHandbook({ top_match: 'Quartz', confidence: 0.9 }, null);
  assertEquals(enforcement.disclaimers.length >= 2, true);
  assert(enforcement.disclaimers.some((d) => d.includes('land ownership')));
});