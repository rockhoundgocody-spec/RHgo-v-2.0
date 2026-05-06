/**
 * progressiveVerify — Test-Time Diffusion inspired Progressive Specimen Verification
 *
 * Inspired by TTD-DR (Han et al., 2025):
 *   Stage 1: Generate noisy initial draft + verification plan
 *   Stage 2: Iterative denoising — each field answer refines the draft
 *   Stage 3: Multi-agent crossover review → merged final result
 *
 * Actions:
 *   'init'    — first image(s), generates noisy draft + plan + next question
 *   'refine'  — user answered a question, denoise the draft
 *   'finalise'— run all 6 specialist reviewers + crossover merge
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const REVIEWERS = ['mineral_id', 'lookalike_risk', 'field_test', 'locality', 'safety', 'value'];

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

      const r = await base44.integrations.Core.InvokeLLM({
        model: 'gemini_3_flash',
        prompt:
          'You are an expert geological field assistant. Produce a NOISY INITIAL DRAFT identification for this specimen — ' +
          'treat it as a first-pass guess, not a final answer. Be honest about uncertainty.' + localityHint +
          ' Return: primary_name, common_name, confidence (0-1, conservative), rarity, ' +
          'observed_traits (array of {trait, value}), ' +
          'uncertainty_flags (array of string — what you cannot tell from image alone), ' +
          'lookalikes (array of {name, differentiator}), ' +
          'verification_plan (ordered array of {key, test, why, priority 1-10} — field tests that would most improve confidence, ' +
          'keys from: hardness, streak, luster, cleavage, transparency, magnetism, locality, closeup, safety, value). ' +
          'Also return next_question: the single highest-priority question to ask the user right now — ' +
          '{key, question, type (choice|text|number|photo|skip), options (array, for choice type)}.',
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
            verification_plan: {
              type: 'array',
              items: { type: 'object', properties: { key: { type: 'string' }, test: { type: 'string' }, why: { type: 'string' }, priority: { type: 'integer' } } }
            },
            next_question: {
              type: 'object',
              properties: {
                key: { type: 'string' }, question: { type: 'string' },
                type: { type: 'string', enum: ['choice', 'text', 'number', 'photo', 'skip'] },
                options: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          required: ['primary_name', 'confidence']
        }
      });

      const draft = await base44.entities.SpecimenDraft.create({
        owner_email: user.email,
        image_urls,
        lat: lat ?? null,
        lng: lng ?? null,
        primary_name: r.primary_name,
        common_name: r.common_name || '',
        confidence: r.confidence,
        rarity: r.rarity || 'common',
        revision: 0,
        status: 'verifying',
        field_answers: [],
        verification_plan: r.verification_plan || [],
        next_question: r.next_question || null,
        delta_log: [{
          revision: 0,
          what_changed: 'Initial noisy draft generated',
          why: 'First-pass image analysis',
          confidence_before: 0,
          confidence_after: r.confidence
        }],
        review_results: {},
        final_result: null
      });

      return Response.json({ draft, initial: r });
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
      const answersText = answers.map(a => `${a.question_key}: ${a.answer}`).join('\n');

      const r = await base44.integrations.Core.InvokeLLM({
        model: 'gemini_3_flash',
        prompt:
          `You are denoising a specimen identification draft. Current draft: "${prevName}" at ${(prevConf * 100).toFixed(0)}% confidence.\n` +
          `New field evidence provided by the user:\n${answersText}\n\n` +
          'Revise the identification based on this new evidence. Return:\n' +
          'primary_name, common_name, confidence (revised, 0-1), rarity, ' +
          'what_changed (one sentence — what the new evidence revealed), ' +
          'why_changed (one sentence — geological reasoning), ' +
          'remaining_uncertainty (array of strings — what is still unknown), ' +
          'lookalikes_still_possible (array of {name, reason}), ' +
          'next_question (next single most useful field question: {key, question, type, options}) or null if enough evidence. ' +
          'If confidence >= 0.82, set next_question to null to signal halting.',
        file_urls: existing.image_urls || [],
        response_json_schema: {
          type: 'object',
          properties: {
            primary_name: { type: 'string' },
            common_name: { type: 'string' },
            confidence: { type: 'number' },
            rarity: { type: 'string', enum: ['common', 'uncommon', 'rare', 'legendary'] },
            what_changed: { type: 'string' },
            why_changed: { type: 'string' },
            remaining_uncertainty: { type: 'array', items: { type: 'string' } },
            lookalikes_still_possible: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, reason: { type: 'string' } } } },
            next_question: {
              type: 'object',
              properties: {
                key: { type: 'string' }, question: { type: 'string' },
                type: { type: 'string', enum: ['choice', 'text', 'number', 'photo', 'skip'] },
                options: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          required: ['primary_name', 'confidence']
        }
      });

      const newRevision = (existing.revision || 0) + 1;
      const deltaLog = [
        ...(existing.delta_log || []),
        {
          revision: newRevision,
          what_changed: r.what_changed || '',
          why: r.why_changed || '',
          confidence_before: prevConf,
          confidence_after: r.confidence
        }
      ];

      const halted = r.confidence >= 0.82 || !r.next_question;

      const updated = await base44.entities.SpecimenDraft.update(draft_id, {
        primary_name: r.primary_name,
        common_name: r.common_name || existing.common_name,
        confidence: r.confidence,
        rarity: r.rarity || existing.rarity,
        revision: newRevision,
        field_answers: answers,
        next_question: halted ? null : r.next_question,
        delta_log: deltaLog,
        status: halted ? 'drafting' : 'verifying'
      });

      return Response.json({ draft: updated, refined: r, halted });
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
        `Specimen: "${existing.primary_name}" (${(existing.confidence * 100).toFixed(0)}% confidence after ${existing.revision} revision(s)).\n` +
        `Field evidence collected:\n${answersText}\n` +
        (existing.lat ? `Locality: ${existing.lat.toFixed(3)}, ${existing.lng.toFixed(3)}` : '');

      const reviewPrompts = {
        mineral_id: 'You are the Mineral ID Reviewer. Given the current draft and evidence, provide: final_name, final_confidence, supporting_evidence (array), identification_notes.',
        lookalike_risk: 'You are the Lookalike Risk Reviewer. Identify which lookalikes are still possible and which are ruled out. Return: ruled_out (array of {name, reason}), still_possible (array of {name, risk_level, differentiating_test}).',
        field_test: 'You are the Field Test Reviewer. Given the answers provided, evaluate how well each field test was completed. Return: tests_completed (array of {test, result, weight}), recommended_next_test (string).',
        locality: 'You are the Locality & Geology Reviewer. Given the location or habitat description, assess geological plausibility. Return: geological_plausibility (0-1), formation_context (string), locality_notes (string).',
        safety: 'You are the Safety Reviewer. Does this specimen pose any safety concerns? Return: has_warning (boolean), warning (string or null), handling_notes (string or null).',
        value: 'You are the Value & Marketplace Reviewer. Estimate collector value. Return: value_low_usd (number), value_high_usd (number), value_factors (array of string), market_note (string).'
      };

      const reviewResults = {};
      await Promise.all(
        REVIEWERS.map(async (reviewer) => {
          const r = await base44.integrations.Core.InvokeLLM({
            model: 'gemini_3_flash',
            prompt: `${reviewPrompts[reviewer]}\n\nContext:\n${context}`,
            file_urls: imageUrls.length ? imageUrls : undefined,
            response_json_schema: { type: 'object' }
          });
          reviewResults[reviewer] = r;
        })
      );

      const reviewsText = JSON.stringify(reviewResults, null, 2);
      const merged = await base44.integrations.Core.InvokeLLM({
        model: 'gemini_3_flash',
        prompt:
          'You are the Final Synthesis Agent. Six specialist reviewers have analysed a mineral specimen. ' +
          'Merge their outputs into one definitive, polished result. Write for a field rockhound.\n\n' +
          `Specialist reviews:\n${reviewsText}\n\n` +
          'Return: primary_name, confidence (0-1), evidence_summary (2-3 sentences), ' +
          'lookalikes_ruled_out (array of strings), next_test (string or "None needed"), ' +
          'collection_note (1 sentence), value_range (string e.g. "$5–$40"), safety_warning (string or null).',
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
        confidence: merged.confidence,
        review_results: reviewResults,
        final_result: merged
      });

      return Response.json({ draft: updated, final: merged });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});