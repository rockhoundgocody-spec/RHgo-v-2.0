/**
 * RockHound-GO Operating Handbook — the single source of truth for
 * identification certainty rules, disclaimers, legal/safety escalation,
 * provenance, and marketplace/appraisal rules.
 *
 * Every AI-facing backend function imports from here. Rules are enforced
 * in code (applyHandbook), not just suggested in prompts.
 */

export const HANDBOOK_VERSION = '1.0.0';

export const CERTAINTY_RULES = {
  // Below this, the result MUST be routed to expert/community review
  expertReviewThreshold: 0.8,
  // AI may never claim confidence above this without human verification
  maxUnverifiedConfidence: 0.92,
  // Below this, value estimates must be withheld
  minConfidenceForValue: 0.65,
  // Below this context integrity, rarity scoring is unreliable
  minContextForRarity: 0.45,
};

export const DISCLAIMERS = {
  identification:
    'AI identification is an educated estimate, not a certified determination. Verify with field tests or an expert before relying on it.',
  value:
    'Value estimates are informational only and do not constitute a professional appraisal.',
  legal:
    'Always confirm land ownership and collecting regulations before collecting. Never collect on private property without written permission, or in national parks and protected sites.',
  safety:
    'This specimen may contain hazardous material. Do not cut, crush, or inhale dust from it, and wash hands after handling.',
  new_occurrence:
    'A find outside the known range for this mineral is not confirmed until reviewed by an expert. It has been flagged for review.',
};

// Minerals/keywords that trigger the safety escalation procedure
export const HAZARDOUS_KEYWORDS = [
  'asbestos', 'asbestiform', 'erionite', 'torbernite', 'autunite',
  'uraninite', 'thorite', 'radioactive', 'uranium', 'cinnabar', 'mercury',
  'galena', 'arsenopyrite', 'orpiment', 'realgar', 'stibnite', 'chalcanthite',
];

/**
 * Rules injected verbatim into every identification prompt so the model
 * operates under the same constraints the code enforces.
 */
export function handbookPromptBlock() {
  return [
    'OPERATING RULES (mandatory):',
    '1. Never claim certainty — report calibrated confidence and always list lookalikes that could be confused with your top match.',
    '2. Do not inflate confidence when image quality, lighting, or angle coverage is poor — say what additional evidence would change your answer.',
    '3. If the specimen is geologically implausible for the given locality/bedrock, lower confidence and say why.',
    '4. Only give a value estimate when identification evidence is strong; otherwise state that more information is needed.',
    '5. If the specimen may be hazardous (radioactive, asbestiform, arsenic/mercury/lead-bearing), state the hazard plainly and include handling precautions.',
    '6. Never encourage collecting at protected, private, or restricted sites.',
    '7. Keep language appropriate for all ages, including children.',
  ].join(' ');
}

/**
 * Enforce handbook rules on a raw identification result.
 * Returns { identification, enforcement } — identification is adjusted
 * in place (confidence caps, value withheld), enforcement is the audit
 * record of every rule applied.
 */
export function applyHandbook(identification, contextIntegrity) {
  const enforcement = {
    handbook_version: HANDBOOK_VERSION,
    rules_applied: [],
    disclaimers: [DISCLAIMERS.identification, DISCLAIMERS.legal],
    confidence_original: identification.confidence ?? null,
    expert_review_required: false,
    safety_flag: false,
    value_withheld: false,
    rarity_unreliable: false,
  };

  let confidence = Number(identification.confidence) || 0;
  if (confidence > 1) confidence = confidence / 100; // normalize 0-100 → 0-1

  // Rule: hard cap without human verification
  if (confidence > CERTAINTY_RULES.maxUnverifiedConfidence) {
    confidence = CERTAINTY_RULES.maxUnverifiedConfidence;
    enforcement.rules_applied.push('confidence_capped_unverified');
  }

  // Rule: context integrity caps confidence
  if (contextIntegrity && confidence > contextIntegrity.confidence_cap) {
    confidence = contextIntegrity.confidence_cap;
    enforcement.rules_applied.push('confidence_capped_low_context');
  }

  identification.confidence = Math.round(confidence * 100) / 100;

  // Rule: expert review below threshold
  if (confidence < CERTAINTY_RULES.expertReviewThreshold) {
    enforcement.expert_review_required = true;
    enforcement.rules_applied.push('expert_review_required');
  }

  // Rule: withhold value estimate on weak evidence
  if (confidence < CERTAINTY_RULES.minConfidenceForValue) {
    if (identification.value_estimate) {
      identification.value_estimate = null;
      enforcement.value_withheld = true;
      enforcement.rules_applied.push('value_estimate_withheld');
    }
  } else if (identification.value_estimate) {
    enforcement.disclaimers.push(DISCLAIMERS.value);
  }

  // Rule: rarity unreliable on weak context
  if (contextIntegrity && contextIntegrity.score < CERTAINTY_RULES.minContextForRarity) {
    enforcement.rarity_unreliable = true;
    enforcement.rules_applied.push('rarity_flagged_low_context');
  }

  // Rule: safety escalation on hazardous material
  const haystack = [
    identification.top_match, identification.scientific_name,
    identification.description, identification.chemical_formula,
  ].filter(Boolean).join(' ').toLowerCase();
  if (HAZARDOUS_KEYWORDS.some((k) => haystack.includes(k))) {
    enforcement.safety_flag = true;
    enforcement.disclaimers.push(DISCLAIMERS.safety);
    enforcement.rules_applied.push('safety_escalation');
  }

  return { identification, enforcement };
}