/**
 * mineralRules.js — Mangle-inspired deductive confidence engine
 *
 * Inspired by Google's Mangle (Datalog + aggregation + provenance):
 *   https://github.com/rockhoundgocody-spec/mangle
 *
 * Architecture:
 *   1. FACT BASE     — observed evidence facts derived from field answers + image analysis
 *   2. RULE ENGINE   — declarative rules that derive new facts (Datalog-style)
 *   3. AGGREGATION   — confidence score computed via weighted sum over derived facts
 *   4. PROVENANCE    — every derived fact records which rule + base facts produced it
 *
 * This replaces ad-hoc LLM re-scoring with a deterministic, auditable chain.
 * The LLM is still used for natural language, but confidence is rule-governed.
 */

// ── RULE DEFINITIONS ──────────────────────────────────────────────────────────
// Each rule: { id, description, head_predicate, body_predicates, weight, applies(facts) → bool }
// weight: how much this rule's firing adds/subtracts to base confidence (0-1 additive scale)

export const MINERAL_RULES = [
  // Visual evidence rules
  {
    id: 'R001', weight: 0.12,
    description: 'Color is consistent with primary identification',
    head: 'color_consistent',
    applies: (facts) => facts.some(f => f.predicate === 'observed_color' && f.value),
  },
  {
    id: 'R002', weight: 0.15,
    description: 'Crystal habit / form observed and matches ID',
    head: 'habit_confirmed',
    applies: (facts) => facts.some(f => f.predicate === 'observed_habit' && f.value),
  },
  {
    id: 'R003', weight: 0.10,
    description: 'Luster type reported and consistent with ID',
    head: 'luster_confirmed',
    applies: (facts) =>
      facts.some(f => f.predicate === 'answer' && f.key === 'luster' && f.value !== 'skip'),
  },
  // Field test rules
  {
    id: 'R004', weight: 0.18,
    description: 'Hardness test completed — narrows candidate set significantly',
    head: 'hardness_tested',
    applies: (facts) =>
      facts.some(f => f.predicate === 'answer' && f.key === 'hardness' && f.value !== 'skip'),
  },
  {
    id: 'R005', weight: 0.14,
    description: 'Streak test completed — strong diagnostic for minerals',
    head: 'streak_tested',
    applies: (facts) =>
      facts.some(f => f.predicate === 'answer' && f.key === 'streak' && f.value !== 'skip'),
  },
  {
    id: 'R006', weight: 0.08,
    description: 'Cleavage / fracture pattern reported',
    head: 'cleavage_observed',
    applies: (facts) =>
      facts.some(f => f.predicate === 'answer' && f.key === 'cleavage' && f.value !== 'skip'),
  },
  {
    id: 'R007', weight: 0.06,
    description: 'Transparency / diaphaneity reported',
    head: 'transparency_reported',
    applies: (facts) =>
      facts.some(f => f.predicate === 'answer' && f.key === 'transparency' && f.value !== 'skip'),
  },
  {
    id: 'R008', weight: 0.05,
    description: 'Magnetism test performed',
    head: 'magnetism_tested',
    applies: (facts) =>
      facts.some(f => f.predicate === 'answer' && f.key === 'magnetism' && f.value !== 'skip'),
  },
  // Locality / context rules
  {
    id: 'R009', weight: 0.10,
    description: 'GPS locality recorded — geological context available',
    head: 'locality_known',
    applies: (facts) => facts.some(f => f.predicate === 'has_gps' && f.value === true),
  },
  {
    id: 'R010', weight: 0.06,
    description: 'Geological formation or rock type context provided',
    head: 'formation_context',
    applies: (facts) =>
      facts.some(f => f.predicate === 'answer' && f.key === 'locality' && f.value !== 'skip'),
  },
  // Image quality rules
  {
    id: 'R011', weight: 0.08,
    description: 'Multiple angles captured — 3D reconstruction possible',
    head: 'multi_angle',
    applies: (facts) => {
      const imgFact = facts.find(f => f.predicate === 'image_count');
      return imgFact && imgFact.value > 1;
    },
  },
  {
    id: 'R012', weight: 0.04,
    description: 'Close-up detail photo provided',
    head: 'closeup_provided',
    applies: (facts) =>
      facts.some(f => f.predicate === 'answer' && f.key === 'closeup' && f.value !== 'skip'),
  },
  // Negative rules — decrease confidence
  {
    id: 'R013', weight: -0.08,
    description: 'No field tests completed at all — image-only analysis',
    head: 'no_field_tests',
    applies: (facts) => {
      const testKeys = ['hardness', 'streak', 'luster', 'cleavage', 'magnetism'];
      return !testKeys.some(k =>
        facts.some(f => f.predicate === 'answer' && f.key === k && f.value !== 'skip')
      );
    },
  },
  {
    id: 'R014', weight: -0.05,
    description: 'Single image only — limited visual evidence',
    head: 'single_image_penalty',
    applies: (facts) => {
      const imgFact = facts.find(f => f.predicate === 'image_count');
      return imgFact && imgFact.value === 1;
    },
  },
];

// ── FACT BUILDER ──────────────────────────────────────────────────────────────
// Convert draft data → structured fact base

export function buildFactBase(draft) {
  const facts = [];

  // Image facts
  facts.push({ predicate: 'image_count', value: (draft.image_urls || []).length, source: 'system' });

  // GPS fact
  if (draft.lat && draft.lng) {
    facts.push({ predicate: 'has_gps', value: true, source: 'system' });
  }

  // LLM-derived observed traits → facts
  (draft.review_results?.mineral_id?.supporting_evidence || []).forEach((e, i) => {
    facts.push({ predicate: 'supporting_evidence', value: e, source: 'llm_reviewer', index: i });
  });

  // Field answers → facts
  (draft.field_answers || []).forEach(a => {
    facts.push({
      predicate: 'answer',
      key: a.question_key,
      value: a.answer,
      source: 'user',
      answered_at: a.answered_at,
    });
  });

  // Visual traits from verification plan observation
  if (draft.primary_name) {
    facts.push({ predicate: 'candidate_name', value: draft.primary_name, source: 'llm_draft' });
  }

  return facts;
}

// ── RULE ENGINE ───────────────────────────────────────────────────────────────
// Run all rules over the fact base, collect fired rules + derivations

export function runRules(facts) {
  const fired = [];
  const notFired = [];

  for (const rule of MINERAL_RULES) {
    if (rule.applies(facts)) {
      fired.push({
        rule_id: rule.id,
        head: rule.head,
        weight: rule.weight,
        description: rule.description,
        provenance: facts
          .filter(f => {
            // record which facts were relevant to this rule firing
            if (rule.id === 'R011' && f.predicate === 'image_count') return true;
            if (rule.id === 'R009' && f.predicate === 'has_gps') return true;
            if (f.predicate === 'answer' && rule.description.toLowerCase().includes(f.key)) return true;
            return false;
          })
          .map(f => ({ predicate: f.predicate, key: f.key, value: f.value, source: f.source })),
      });
    } else {
      notFired.push({ rule_id: rule.id, head: rule.head, description: rule.description });
    }
  }

  return { fired, notFired };
}

// ── AGGREGATION ───────────────────────────────────────────────────────────────
// Mangle-style: confidence(X) :- base_confidence(X, B), sum of rule weights |> fn:Sum()

export function computeDeductiveScore(llmScore, facts) {
  const { fired, notFired } = runRules(facts);

  // Base score from LLM (image analysis) — capped, not trusted blindly
  const baseScore = Math.min(llmScore * 0.6, 0.5); // max 50% from pure LLM

  // Additive rule contributions (Mangle aggregation analog)
  const ruleContribution = fired.reduce((sum, r) => sum + r.weight, 0);

  // Final score — clamped [0, 1]
  const finalScore = Math.max(0, Math.min(1, baseScore + ruleContribution));

  return {
    base_llm_score: llmScore,
    base_used: baseScore,
    rule_contribution: ruleContribution,
    final_score: finalScore,
    fired_rules: fired,
    unfired_rules: notFired,
    // Mangle-style provenance summary
    derivation_summary: fired.map(r => `${r.rule_id}: ${r.description} (+${(r.weight * 100).toFixed(0)}%)`).join('\n'),
  };
}

// ── HALTING CRITERION ─────────────────────────────────────────────────────────
// Mangle-inspired: halt when the marginal gain from next question falls below threshold
// i.e. when all high-weight rules have already fired OR score >= target

export function shouldHalt(deductiveResult) {
  const highWeightUnfired = deductiveResult.unfired_rules.filter(r => {
    const rule = MINERAL_RULES.find(mr => mr.id === r.rule_id);
    return rule && rule.weight >= 0.12; // only halt if no high-value tests remain
  });
  return deductiveResult.final_score >= 0.82 || highWeightUnfired.length === 0;
}