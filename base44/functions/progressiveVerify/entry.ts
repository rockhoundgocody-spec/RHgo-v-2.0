/**
 * progressiveVerify — Test-Time Diffusion + Mangle Deductive Engine
 *
 * Architecture:
 *   Stage 1 (init)     — LLM noisy draft + deductive fact base seeded from image
 *   Stage 2 (refine)   — User answer → append fact → re-run rule engine → LLM narrates delta
 *   Stage 3 (finalise) — 6 specialist reviewers → synthesis + final deductive score
 *
 * Confidence is NOW computed by a Mangle-inspired deductive rule engine,
 * not purely by the LLM. The LLM contributes a base score (≤50%) and
 * declarative rules add the rest based on collected field evidence.
 *
 * Provenance: every confidence change is traced to the specific rule that fired.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const REVIEWERS = ['mineral_id', 'lookalike_risk', 'field_test', 'locality', 'safety', 'value'];

// ── Mangle-inspired deductive rule engine (inlined for Deno — no local imports) ──

const MINERAL_RULES = [
  { id: 'R001', weight: 0.12, head: 'color_consistent',       description: 'Color observed and consistent with ID',          applies: (f) => f.some(x => x.predicate === 'observed_trait' && x.key === 'color') },
  { id: 'R002', weight: 0.15, head: 'habit_confirmed',        description: 'Crystal habit observed and matches ID',          applies: (f) => f.some(x => x.predicate === 'observed_trait' && x.key === 'habit') },
  { id: 'R003', weight: 0.10, head: 'luster_confirmed',       description: 'Luster type reported by user',                  applies: (f) => f.some(x => x.predicate === 'answer' && x.key === 'luster' && x.value !== 'skip') },
  { id: 'R004', weight: 0.18, head: 'hardness_tested',        description: 'Hardness test completed — narrows candidates',  applies: (f) => f.some(x => x.predicate === 'answer' && x.key === 'hardness' && x.value !== 'skip') },
  { id: 'R005', weight: 0.14, head: 'streak_tested',          description: 'Streak test completed — strong diagnostic',     applies: (f) => f.some(x => x.predicate === 'answer' && x.key === 'streak' && x.value !== 'skip') },
  { id: 'R006', weight: 0.08, head: 'cleavage_observed',      description: 'Cleavage / fracture pattern reported',          applies: (f) => f.some(x => x.predicate === 'answer' && x.key === 'cleavage' && x.value !== 'skip') },
  { id: 'R007', weight: 0.06, head: 'transparency_reported',  description: 'Transparency / diaphaneity reported',           applies: (f) => f.some(x => x.predicate === 'answer' && x.key === 'transparency' && x.value !== 'skip') },
  { id: 'R008', weight: 0.05, head: 'magnetism_tested',       description: 'Magnetism test performed',                     applies: (f) => f.some(x => x.predicate === 'answer' && x.key === 'magnetism' && x.value !== 'skip') },
  { id: 'R009', weight: 0.10, head: 'locality_known',         description: 'GPS locality recorded — geological context',   applies: (f) => f.some(x => x.predicate === 'has_gps') },
  { id: 'R010', weight: 0.06, head: 'formation_context',      description: 'Geological formation or rock type provided',   applies: (f) => f.some(x => x.predicate === 'answer' && x.key === 'locality' && x.value !== 'skip') },
  { id: 'R011', weight: 0.08, head: 'multi_angle',            description: 'Multiple photo angles captured',               applies: (f) => { const img = f.find(x => x.predicate === 'image_count'); return img && img.value > 1; } },
  { id: 'R012', weight: 0.04, head: 'closeup_provided',       description: 'Close-up detail photo provided',              applies: (f) => f.some(x => x.predicate === 'answer' && x.key === 'closeup' && x.value !== 'skip') },
  { id: 'R013', weight: -0.08, head: 'no_field_tests',        description: 'No field tests completed — image only',       applies: (f) => !['hardness','streak','luster','cleavage','magnetism'].some(k => f.some(x => x.predicate === 'answer' && x.key === k && x.value !== 'skip')) },
  { id: 'R014', weight: -0.05, head: 'single_image_penalty',  description: 'Single image only — limited visual evidence', applies: (f) => { const img = f.find(x => x.predicate === 'image_count'); return img && img.value === 1; } },
];

function buildFactBase(imageUrls, lat, lng, fieldAnswers, observedTraits) {
  const facts = [];
  facts.push({ predicate: 'image_count', value: imageUrls.length });
  if (lat && lng) facts.push({ predicate: 'has_gps', value: true });
  (observedTraits || []).forEach(t => facts.push({ predicate: 'observed_trait', key: t.trait, value: t.value }));
  (fieldAnswers || []).forEach(a => facts.push({ predicate: 'answer', key: a.question_key, value: a.answer }));
  return facts;
}

function runDeductiveEngine(llmScore, facts) {
  const fired = [], notFired = [];
  for (const rule of MINERAL_RULES) {
    (rule.applies(facts) ? fired : notFired).push(rule);
  }
  const baseScore = Math.min(llmScore * 0.6, 0.5);
  const ruleContribution = fired.reduce((s, r) => s + r.weight, 0);
  const finalScore = Math.max(0, Math.min(1, baseScore + ruleContribution));
  return {
    base_llm_score: llmScore,
    rule_contribution: ruleContribution,
    final_score: finalScore,
    fired_rules: fired.map(r => ({ id: r.id, head: r.head, weight: r.weight, description: r.description })),
    unfired_rules: notFired.map(r => ({ id: r.id, head: r.head, weight: r.weight, description: r.description })),
  };
}

function shouldHalt(engine) {
  const highWeightUnfired = engine.unfired_rules.filter(r => r.weight >= 0.12);
  return engine.final_score >= 0.82 || highWeightUnfired.length === 0;
}

// ── HANDLER ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, draft_id, image_urls = [], lat, lng, answer_key, answer_text } = body;

    // ── INIT ──────────────────────────────────────────────────────────────────
    if (action === 'init') {
      if (!image_urls.length) return Response.json({ error: 'image_urls required' }, { status: 400 });

      const localityHint = (lat && lng) ? ` Locality: ${lat.toFixed(3)}, ${lng.toFixed(3)}.` : '';

      const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
        model: 'gemini_3_flash',
        prompt:
          'You are an expert geological field assistant. Produce a NOISY INITIAL DRAFT identification. ' +
          'Be honest about uncertainty — teach observational geology, do not overclaim.' + localityHint +
          ' Return: primary_name, common_name, confidence (0-1, conservative, image-only), rarity, ' +
          'observed_traits (array of {trait, value} — only what you can actually see), ' +
          'uncertainty_flags (array of string — what you cannot tell from image alone), ' +
          'lookalikes (array of {name, differentiator}), ' +
          'verification_plan (ordered array of {key, test, why, priority 1-10}, ' +
          'keys from: hardness, streak, luster, cleavage, transparency, magnetism, locality, closeup, safety, value). ' +
          'next_question: single highest-priority question: {key, question, type (choice|text|number|photo), options (for choice)}.',
        file_urls: image_urls,
        response_json_schema: {
          type: 'object',
          properties: {
            primary_name: { type: 'string' },
            common_name: { type: 'string' },
            confidence: { type: 'number' },
            rarity: { type: 'string', enum: ['common', 'uncommon', 'rare', 'legendary'] },
            observed_traits: { type: 'array', items: { type: 'object', properties: { trait: { type: 'string' }, value: { type: 'string' } } } },
            uncertainty_flags: { type: 'array', items: { type: 'string' } },
            lookalikes: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, differentiator: { type: 'string' } } } },
            verification_plan: { type: 'array', items: { type: 'object', properties: { key: { type: 'string' }, test: { type: 'string' }, why: { type: 'string' }, priority: { type: 'integer' } } } },
            next_question: { type: 'object', properties: { key: { type: 'string' }, question: { type: 'string' }, type: { type: 'string', enum: ['choice', 'text', 'number', 'photo'] }, options: { type: 'array', items: { type: 'string' } } } }
          },
          required: ['primary_name', 'confidence']
        }
      });

      // Run deductive engine on initial facts
      const facts = buildFactBase(image_urls, lat, lng, [], r.observed_traits || []);
      const engine = runDeductiveEngine(r.confidence, facts);

      const draft = await base44.entities.SpecimenDraft.create({
        owner_email: user.email,
        image_urls,
        lat: lat ?? null,
        lng: lng ?? null,
        primary_name: r.primary_name,
        common_name: r.common_name || '',
        confidence: engine.final_score,  // ← deductive score, not raw LLM
        rarity: r.rarity || 'common',
        revision: 0,
        status: 'verifying',
        field_answers: [],
        verification_plan: r.verification_plan || [],
        next_question: r.next_question || null,
        delta_log: [{
          revision: 0,
          what_changed: 'Initial noisy draft — image analysis only',
          why: `Deductive engine: base LLM ${(r.confidence * 100).toFixed(0)}% → rules adjusted to ${(engine.final_score * 100).toFixed(0)}%`,
          confidence_before: 0,
          confidence_after: engine.final_score,
          engine_snapshot: engine,
        }],
        review_results: {
          _engine_init: engine,
          _observed_traits: r.observed_traits || [],
          _uncertainty_flags: r.uncertainty_flags || [],
          _lookalikes: r.lookalikes || [],
        },
        final_result: null
      });

      return Response.json({ draft, initial: r, engine });
    }

    // ── REFINE ────────────────────────────────────────────────────────────────
    if (action === 'refine') {
      if (!draft_id) return Response.json({ error: 'draft_id required' }, { status: 400 });

      const existing = await base44.entities.SpecimenDraft.get(draft_id);
      if (!existing) return Response.json({ error: 'Draft not found' }, { status: 404 });
      if (existing.owner_email !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const prevConf = existing.confidence;
      const prevName = existing.primary_name;
      const answers = [
        ...(existing.field_answers || []),
        { question_key: answer_key, question: '', answer: answer_text, answered_at: new Date().toISOString() }
      ];

      // Re-run rule engine with new fact base BEFORE calling LLM
      const initTraits = existing.review_results?._observed_traits || [];
      const facts = buildFactBase(existing.image_urls || [], existing.lat, existing.lng, answers, initTraits);
      const engine = runDeductiveEngine(existing.review_results?._engine_init?.base_llm_score || prevConf, facts);

      const answersText = answers.map(a => `${a.question_key}: ${a.answer}`).join('\n');

      // LLM only narrates what changed — score comes from rules
      const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
        model: 'gemini_3_flash',
        prompt:
          `Specimen draft: "${prevName}" (currently ${(engine.final_score * 100).toFixed(0)}% confidence via rule engine).\n` +
          `Field evidence so far:\n${answersText}\n\n` +
          'Narrate the identification revision. Return:\n' +
          'primary_name (may stay the same or change), common_name, rarity, ' +
          'what_changed (one sentence — what new evidence revealed), ' +
          'why_changed (one sentence — geological reasoning), ' +
          'remaining_uncertainty (array — what is still unknown), ' +
          'lookalikes_still_possible (array of {name, reason}), ' +
          'next_question ({key, question, type, options}) — the single most useful next test, or omit if enough evidence.',
        file_urls: existing.image_urls || [],
        response_json_schema: {
          type: 'object',
          properties: {
            primary_name: { type: 'string' },
            common_name: { type: 'string' },
            rarity: { type: 'string', enum: ['common', 'uncommon', 'rare', 'legendary'] },
            what_changed: { type: 'string' },
            why_changed: { type: 'string' },
            remaining_uncertainty: { type: 'array', items: { type: 'string' } },
            lookalikes_still_possible: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, reason: { type: 'string' } } } },
            next_question: { type: 'object', properties: { key: { type: 'string' }, question: { type: 'string' }, type: { type: 'string', enum: ['choice', 'text', 'number', 'photo'] }, options: { type: 'array', items: { type: 'string' } } } }
          },
          required: ['primary_name']
        }
      });

      const newRevision = (existing.revision || 0) + 1;
      const halted = shouldHalt(engine);

      // Identify which new rule fired this revision
      const prevEngine = existing.delta_log?.[existing.delta_log.length - 1]?.engine_snapshot;
      const prevFiredIds = new Set((prevEngine?.fired_rules || []).map(r => r.id));
      const newlyFired = engine.fired_rules.filter(r => !prevFiredIds.has(r.id));
      const ruleNarrative = newlyFired.length > 0
        ? `Rules newly fired: ${newlyFired.map(r => r.description).join('; ')}`
        : 'No new rules fired — evidence consistent with existing draft';

      const deltaLog = [
        ...(existing.delta_log || []),
        {
          revision: newRevision,
          what_changed: r.what_changed || ruleNarrative,
          why: r.why_changed || `Deductive engine: ${newlyFired.length} new rule(s) fired`,
          confidence_before: prevConf,
          confidence_after: engine.final_score,
          engine_snapshot: engine,
          newly_fired_rules: newlyFired.map(r => r.id),
        }
      ];

      const updated = await base44.entities.SpecimenDraft.update(draft_id, {
        primary_name: r.primary_name,
        common_name: r.common_name || existing.common_name,
        confidence: engine.final_score,   // ← deductive score
        rarity: r.rarity || existing.rarity,
        revision: newRevision,
        field_answers: answers,
        next_question: halted ? null : (r.next_question || null),
        delta_log: deltaLog,
        status: halted ? 'drafting' : 'verifying',
        review_results: {
          ...(existing.review_results || {}),
          _engine_latest: engine,
        }
      });

      return Response.json({ draft: updated, refined: r, engine, halted });
    }

    // ── FINALISE ──────────────────────────────────────────────────────────────
    if (action === 'finalise') {
      if (!draft_id) return Response.json({ error: 'draft_id required' }, { status: 400 });

      const existing = await base44.entities.SpecimenDraft.get(draft_id);
      if (!existing) return Response.json({ error: 'Draft not found' }, { status: 404 });
      if (existing.owner_email !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const answersText = (existing.field_answers || []).map(a => `${a.question_key}: ${a.answer}`).join('\n') || 'None collected.';
      const imageUrls = existing.image_urls || [];
      const context =
        `Specimen: "${existing.primary_name}" (${(existing.confidence * 100).toFixed(0)}% deductive confidence after ${existing.revision} revision(s)).\n` +
        `Field evidence:\n${answersText}\n` +
        (existing.lat ? `GPS: ${existing.lat.toFixed(3)}, ${existing.lng.toFixed(3)}` : '');

      // Final engine run with all collected evidence
      const initTraits = existing.review_results?._observed_traits || [];
      const facts = buildFactBase(imageUrls, existing.lat, existing.lng, existing.field_answers || [], initTraits);
      const finalEngine = runDeductiveEngine(
        existing.review_results?._engine_init?.base_llm_score || existing.confidence,
        facts
      );

      const reviewPrompts = {
        mineral_id:     'You are the Mineral ID Reviewer. Return: final_name, final_confidence (0-1), supporting_evidence (array of strings), identification_notes (string).',
        lookalike_risk: 'You are the Lookalike Risk Reviewer. Return: ruled_out (array of {name, reason}), still_possible (array of {name, risk_level, differentiating_test}).',
        field_test:     'You are the Field Test Reviewer. Return: tests_completed (array of {test, result, weight}), recommended_next_test (string).',
        locality:       'You are the Locality & Geology Reviewer. Return: geological_plausibility (0-1), formation_context (string), locality_notes (string).',
        safety:         'You are the Safety Reviewer. Return: has_warning (boolean), warning (string or null), handling_notes (string or null).',
        value:          'You are the Value & Marketplace Reviewer. Return: value_low_usd (number), value_high_usd (number), value_factors (array of string), market_note (string).',
      };

      const reviewResults = {};
      await Promise.all(
        REVIEWERS.map(async (reviewer) => {
          const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
            model: 'gemini_3_flash',
            prompt: `${reviewPrompts[reviewer]}\n\nContext:\n${context}`,
            file_urls: imageUrls.length ? imageUrls : undefined,
            response_json_schema: { type: 'object' }
          });
          reviewResults[reviewer] = r;
        })
      );

      const reviewsText = JSON.stringify(reviewResults, null, 2);
      const merged = await base44.asServiceRole.integrations.Core.InvokeLLM({
        model: 'gemini_3_flash',
        prompt:
          'You are the Final Synthesis Agent. Six specialist reviewers analysed a mineral specimen. ' +
          `The deductive rule engine computed a final confidence of ${(finalEngine.final_score * 100).toFixed(0)}% ` +
          `based on ${finalEngine.fired_rules.length} rules that fired.\n\n` +
          `Specialist reviews:\n${reviewsText}\n\n` +
          'Synthesise into one definitive result for a field rockhound. Return: ' +
          'primary_name, confidence (use the rule engine score, adjust ±5% max for your synthesis), ' +
          'evidence_summary (2-3 sentences), lookalikes_ruled_out (array of strings), ' +
          'next_test (string or "None needed"), collection_note (1 sentence), ' +
          'value_range (string e.g. "$5–$40"), safety_warning (string or null).',
        response_json_schema: {
          type: 'object',
          properties: {
            primary_name: { type: 'string' },
            confidence: { type: 'number' },
            evidence_summary: { type: 'string' },
            lookalikes_ruled_out: { type: 'array', items: { type: 'string' } },
            next_test: { type: 'string' },
            collection_note: { type: 'string' },
            value_range: { type: 'string' },
            safety_warning: { type: 'string' }
          },
          required: ['primary_name', 'confidence']
        }
      });

      const updated = await base44.entities.SpecimenDraft.update(draft_id, {
        status: 'finalised',
        primary_name: merged.primary_name,
        confidence: finalEngine.final_score,  // ← always deductive score
        review_results: {
          ...reviewResults,
          _engine_final: finalEngine,
          _observed_traits: existing.review_results?._observed_traits || [],
          _uncertainty_flags: existing.review_results?._uncertainty_flags || [],
          _lookalikes: existing.review_results?._lookalikes || [],
        },
        final_result: merged
      });

      return Response.json({ draft: updated, final: merged, engine: finalEngine });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});