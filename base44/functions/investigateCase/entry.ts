import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// ─────────────────────────────────────────────────────────────────────────────
// CHRONOLITH — investigateCase
//
// The core inference engine. Takes images, GPS, and field observations,
// then runs nine specialized agents (in a single deep LLM call) to produce:
//   - 3-5 competing causal histories (not one classification)
//   - Evidence-weighted scoring with four independent confidence values
//   - Active contradiction detection (the Skeptic agent)
//   - Optimal next test selection via information gain
//   - A machine-readable case file stored as a ChronolithCase entity
//
// Every result carries: Probability, Evidence Quality, Contradiction Load,
// Verification Depth — because a model can be confidently wrong.
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      image_urls = [],
      lat,
      lng,
      field_observations = [],
      specimen_label,
      case_id,
    } = body;

    // ── Cartographer: fetch bedrock geology from Macrostrat ──
    let geologicUnit = '';
    let geologyContext = '';
    if (lat != null && lng != null) {
      try {
        const resp = await fetch(
          `https://macrostrat.org/api/v2/geologic-unit?lat=${lat}&lng=${lng}&format=json`
        );
        if (resp.ok) {
          const data = await resp.json();
          const units = data?.success?.data || [];
          if (units.length > 0) {
            const u = units[0];
            geologicUnit = u.name || u.t_age_label || 'Unknown unit';
            geologyContext =
              `\n\nGEOLOGICAL CONTEXT (Macrostrat bedrock at find location):\n` +
              `Bedrock unit: ${geologicUnit}\n` +
              `Age: ${u.b_age || '?'}–${u.t_age || '?'} Ma\n` +
              `Lithology: ${u.lith || 'unknown'}\n` +
              `Stratigraphic name: ${u.strat_name || 'unknown'}`;
          }
        }
      } catch {
        // Geology lookup is best-effort — the case proceeds without it
      }
    }

    // ── Format field observations for the LLM ──
    const obsText = field_observations.length > 0
      ? field_observations
          .map((o) => `- ${o.label || o.key}: ${o.value} (reliability: ${o.reliability || 0.7})`)
          .join('\n')
      : '(no field observations yet — the user may add weight, magnetism, density, streak, hardness, etc.)';

    // ── The CHRONOLITH master prompt ──
    const prompt = `You are CHRONOLITH, a causal reconstruction system. Do not merely classify — construct competing histories of how the object came to exist, attack each for contradictions, and select the test that eliminates the most uncertainty.

Run as nine agents: Observer (extract visual features), Material Physicist (density/magnetism/chemistry), Geologist (formation environments), Cartographer (locality plausibility), Chronologist (timeline), Skeptic (find contradictions — most important), Experiment Designer (optimal next test), Simulation Director (reconstruction spec), Jury (final adjudication).

CASE DATA:
- Images: ${image_urls.length} photo(s). Analyze as Observer.
- Suspected identity: ${specimen_label || 'unknown'}
- Field observations:
${obsText}
${geologyContext}

Generate 3-5 competing hypotheses. Include at least one prosaic explanation (industrial/terrestrial/misidentification). For each: probability (all must sum to 1.0), evidence_quality, contradiction_load, verification_depth, supporting_evidence, contradictions, predictions, consequences_if_true, falsification_condition.

RULES: Never convert plausibility into certainty. Search for contradictions, not just supporting evidence. The leading hypothesis MUST have a falsification condition. Never present model consensus as independent verification.

Select the optimal next test: maximize information gain, minimize cost/time/risk. State what the leading vs alternative hypothesis predicts.

Produce the structured output.`;

    // ── Run the nine-agent investigation ──
    const result = await base44.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      prompt,
      file_urls: image_urls,
      response_json_schema: {
        type: 'object',
        properties: {
          opening_statement: {
            type: 'string',
            description: 'A single sentence introducing the investigation — written for someone about to watch reality explain itself',
          },
          specimen_summary: { type: 'string' },
          estimated_age_range: { type: 'string' },
          candidate_environments: { type: 'array', items: { type: 'string' } },
          candidate_locations: { type: 'array', items: { type: 'string' } },
          hypotheses: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                category: {
                  type: 'string',
                  enum: ['extraterrestrial', 'industrial', 'terrestrial', 'composite', 'unknown'],
                },
                probability: { type: 'number' },
                evidence_quality: { type: 'number' },
                contradiction_load: { type: 'number' },
                verification_depth: { type: 'number' },
                supporting_evidence: { type: 'array', items: { type: 'string' } },
                contradictions: { type: 'array', items: { type: 'string' } },
                predictions: { type: 'array', items: { type: 'string' } },
                consequences_if_true: { type: 'string' },
                falsification_condition: { type: 'string' },
              },
            },
          },
          evidence_ledger: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                observation: { type: 'string' },
                source: { type: 'string' },
                reliability: { type: 'number' },
              },
            },
          },
          contradiction_ledger: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                hypotheses_affected: { type: 'array', items: { type: 'string' } },
                severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              },
            },
          },
          missing_evidence: { type: 'array', items: { type: 'string' } },
          next_test: {
            type: 'object',
            properties: {
              test_name: { type: 'string' },
              category: {
                type: 'string',
                enum: ['no_equipment', 'home', 'expert', 'laboratory', 'non_destructive'],
              },
              expected_info_gain: { type: 'number' },
              cost: { type: 'string' },
              time: { type: 'string' },
              risk: { type: 'string' },
              accessibility: { type: 'number' },
              rationale: { type: 'string' },
              expected_outcome_leading: { type: 'string' },
              expected_outcome_alternative: { type: 'string' },
            },
          },
          confidence_sensitivity: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                variable: { type: 'string' },
                impact: { type: 'string' },
              },
            },
          },
          uncertainty_statement: { type: 'string' },
          scientific_explanation: { type: 'string' },
        },
      },
    });

    // ── Persist the case ──
    const caseData = {
      owner_email: user.email,
      image_urls,
      specimen_label: specimen_label || '',
      ...(lat != null ? { lat, lng } : {}),
      field_observations,
      geologic_unit: geologicUnit,
      opening_statement: result.opening_statement || '',
      specimen_summary: result.specimen_summary || '',
      estimated_age_range: result.estimated_age_range || '',
      candidate_environments: result.candidate_environments || [],
      candidate_locations: result.candidate_locations || [],
      hypotheses: result.hypotheses || [],
      evidence_ledger: result.evidence_ledger || [],
      contradiction_ledger: result.contradiction_ledger || [],
      missing_evidence: result.missing_evidence || [],
      next_test: result.next_test || null,
      confidence_sensitivity: result.confidence_sensitivity || [],
      uncertainty_statement: result.uncertainty_statement || '',
      scientific_explanation: result.scientific_explanation || '',
      status: 'investigating',
    };

    let caseRecord;
    if (case_id) {
      caseRecord = await base44.entities.ChronolithCase.update(case_id, caseData);
    } else {
      caseRecord = await base44.entities.ChronolithCase.create(caseData);
    }

    return Response.json({ case: caseRecord });
  } catch (error) {
    console.error('CHRONOLITH investigateCase error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});