/**
 * RockHound-GO Hierarchical Field Reasoning Engine
 *
 * Inspired by HRM (Hierarchical Reasoning Model):
 *   High-Level Module  — slow planner: reads context, decides intent, sets confidence band
 *   Low-Level Module   — fast executor: runs the specific field task
 *   Halting condition  — stops when confidence is sufficient or evidence is lacking
 *
 * All AI-assisted features call `reason()` to get a structured ReasoningResult
 * before producing any user-facing output.
 */

import { base44 } from '@/api/base44Client';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * @typedef {'low'|'medium'|'high'} ConfidenceBand
 *
 * @typedef {Object} Evidence
 * @property {string} type      - 'image'|'locality'|'feature'|'test'|'history'
 * @property {string} label
 * @property {string} [value]
 * @property {number} [weight]  - 0-1 contribution to confidence
 *
 * @typedef {'save'|'compare'|'map'|'rescan'|'list'|'learn'|'expert'} FieldDecision
 *
 * @typedef {Object} ReasoningResult
 * @property {string}          primaryResult
 * @property {ConfidenceBand}  confidenceBand
 * @property {number}          confidenceScore   - 0-1
 * @property {Evidence[]}      evidenceUsed
 * @property {string[]}        uncertainties
 * @property {string[]}        improvementHints  - what would raise confidence
 * @property {FieldDecision}   recommendedAction
 * @property {string}          reasoningSummary  - plain-language explanation
 * @property {boolean}         needsMoreEvidence
 * @property {boolean}         isOfflineFallback
 * @property {any}             [rawData]         - executor's raw output
 */

// ─── Band helpers ─────────────────────────────────────────────────────────────

export function scoreToBand(score) {
  if (score >= 0.75) return 'high';
  if (score >= 0.45) return 'medium';
  return 'low';
}

export function bandLabel(band) {
  return { high: 'High confidence', medium: 'Moderate confidence', low: 'Low confidence' }[band];
}

// ─── High-Level Planner ───────────────────────────────────────────────────────

/**
 * Evaluates available context and decides:
 *  - whether we have enough evidence to proceed
 *  - what the user is trying to do
 *  - what would improve the result
 *  - whether offline fallback applies
 */
function highLevelPlan({ task, imageUrls = [], locality = null, features = [], userTier = 'free', isOffline = false }) {
  const evidenceList = [];
  let evidenceScore = 0;

  if (imageUrls.length > 0) {
    evidenceList.push({ type: 'image', label: `${imageUrls.length} photo${imageUrls.length > 1 ? 's' : ''}`, weight: 0.5 });
    evidenceScore += Math.min(imageUrls.length * 0.25, 0.5);
  }
  if (locality) {
    evidenceList.push({ type: 'locality', label: `Location: ${locality.lat?.toFixed(3)}, ${locality.lng?.toFixed(3)}`, weight: 0.2 });
    evidenceScore += 0.2;
  }
  if (features.length > 0) {
    evidenceList.push({ type: 'feature', label: `${features.length} observed feature${features.length > 1 ? 's' : ''}`, weight: 0.3 });
    evidenceScore += Math.min(features.length * 0.05, 0.3);
  }

  const hints = [];
  if (imageUrls.length === 0) hints.push('Add at least one clear photo');
  if (imageUrls.length === 1) hints.push('Multiple angles improve accuracy');
  if (!locality) hints.push('Share your location for geological context');
  if (features.length === 0) hints.push('Note color, luster, or crystal habit');

  const needsMoreEvidence = evidenceScore < 0.2 || (task === 'identify' && imageUrls.length === 0);

  return { evidenceScore, evidenceList, hints, needsMoreEvidence, isOffline };
}

// ─── Low-Level Executor ───────────────────────────────────────────────────────

/**
 * Runs the actual task using the LLM.
 * Returns raw structured data + confidence from the model.
 */
async function lowLevelExecute({ task, imageUrls, locality, features, notes }) {
  const localityHint = locality
    ? ` Locality: ${locality.lat?.toFixed(3)}, ${locality.lng?.toFixed(3)}.`
    : '';

  const featureHint = features.length > 0
    ? ` Observed: ${features.map((f) => `${f.feature}: ${f.value}`).join('; ')}.`
    : '';

  const notesHint = notes ? ` Field notes: ${notes}.` : '';

  const taskPrompts = {
    identify:
      'Identify the mineral or rock specimen. Return primary name, common name, calibrated confidence (0-1), ' +
      'reasoning (cite color, luster, habit, fracture), observed_features, lookalikes with differentiators, ' +
      'verification_tests with expected outcomes, rarity, and up to 3 ranked candidates with rationale.',
    field_note:
      'Generate a concise field note for this specimen. Include locality context, likely formation, collecting tips, and any legal/safety considerations.',
    value_estimate:
      'Estimate the collector value range for this specimen. Return low_usd, high_usd, factors that affect value, and a one-sentence market note.',
    locality_check:
      'Given this location, what minerals or rock types are geologically plausible? Return a ranked list with formation context and likelihood.',
  };

  const prompt =
    (taskPrompts[task] || taskPrompts.identify) +
    localityHint + featureHint + notesHint +
    ' Be conservative with confidence. Return a structured JSON object.';

  const schema = {
    type: 'object',
    properties: {
      primary_result: { type: 'string' },
      confidence: { type: 'number' },
      reasoning: { type: 'string' },
      candidates: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, confidence: { type: 'number' }, rationale: { type: 'string' } } } },
      observed_features: { type: 'array', items: { type: 'object', properties: { feature: { type: 'string' }, value: { type: 'string' } } } },
      lookalikes: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, differentiator: { type: 'string' } } } },
      verification_tests: { type: 'array', items: { type: 'object', properties: { test: { type: 'string' }, expected: { type: 'string' } } } },
      uncertainty: { type: 'array', items: { type: 'string' } },
      rarity: { type: 'string', enum: ['common', 'uncommon', 'rare', 'legendary'] },
    },
    required: ['primary_result', 'confidence'],
  };

  const r = await base44.integrations.Core.InvokeLLM({
    model: 'gemini_3_flash',
    prompt,
    file_urls: imageUrls.length > 0 ? imageUrls : undefined,
    response_json_schema: schema,
  });

  return r;
}

// ─── Halting Logic ────────────────────────────────────────────────────────────

function shouldHalt({ evidenceScore, modelConfidence, needsMoreEvidence, isOffline }) {
  if (needsMoreEvidence) return { halt: true, reason: 'insufficient_evidence' };
  if (isOffline) return { halt: true, reason: 'offline' };
  // High enough combined signal — stop iterating
  const combined = evidenceScore * 0.4 + (modelConfidence || 0) * 0.6;
  if (combined >= 0.7) return { halt: true, reason: 'sufficient_confidence' };
  return { halt: false, reason: null };
}

// ─── Action Recommendation ────────────────────────────────────────────────────

function recommendAction({ band, task, isOffline, needsMoreEvidence }) {
  if (isOffline || needsMoreEvidence) return 'rescan';
  if (band === 'low') return 'rescan';
  if (band === 'medium') return 'compare';
  if (task === 'identify') return 'save';
  if (task === 'value_estimate') return 'list';
  return 'save';
}

// ─── Main Exported Function ───────────────────────────────────────────────────

/**
 * reason() — the single entry point for all HRM-style reasoning in RockHound-GO.
 *
 * @param {Object} ctx
 * @param {'identify'|'field_note'|'value_estimate'|'locality_check'} ctx.task
 * @param {string[]} [ctx.imageUrls]
 * @param {{lat:number,lng:number}} [ctx.locality]
 * @param {Array<{feature:string,value:string}>} [ctx.features]
 * @param {string} [ctx.notes]
 * @param {'free'|'pro'|'business'} [ctx.userTier]
 * @param {boolean} [ctx.isOffline]
 * @returns {Promise<ReasoningResult>}
 */
export async function reason(ctx) {
  const {
    task = 'identify',
    imageUrls = [],
    locality = null,
    features = [],
    notes = '',
    userTier = 'free',
    isOffline = false,
  } = ctx;

  // 1. High-level plan
  const plan = highLevelPlan({ task, imageUrls, locality, features, userTier, isOffline });

  // 2. Halting check before calling LLM
  const preHalt = shouldHalt({
    evidenceScore: plan.evidenceScore,
    modelConfidence: 0,
    needsMoreEvidence: plan.needsMoreEvidence,
    isOffline,
  });

  if (preHalt.halt && preHalt.reason !== 'sufficient_confidence') {
    const band = 'low';
    return {
      primaryResult: task === 'identify' ? 'Unknown specimen' : 'Insufficient data',
      confidenceBand: band,
      confidenceScore: plan.evidenceScore,
      evidenceUsed: plan.evidenceList,
      uncertainties: ['Not enough evidence to identify'],
      improvementHints: plan.hints,
      recommendedAction: recommendAction({ band, task, isOffline, needsMoreEvidence: plan.needsMoreEvidence }),
      reasoningSummary: isOffline
        ? 'You are offline. Your notes have been saved locally and will sync when connectivity returns.'
        : 'More evidence is needed before a reliable identification can be made.',
      needsMoreEvidence: plan.needsMoreEvidence,
      isOfflineFallback: isOffline,
      rawData: null,
    };
  }

  // 3. Low-level execution
  let rawData = null;
  let modelConfidence = 0;
  try {
    rawData = await lowLevelExecute({ task, imageUrls, locality, features, notes });
    modelConfidence = typeof rawData?.confidence === 'number' ? rawData.confidence : 0.5;
  } catch {
    // network/API failure → offline fallback
    const band = 'low';
    return {
      primaryResult: 'Identification unavailable',
      confidenceBand: band,
      confidenceScore: 0,
      evidenceUsed: plan.evidenceList,
      uncertainties: ['AI service unreachable'],
      improvementHints: ['Try again when connected'],
      recommendedAction: 'rescan',
      reasoningSummary: 'The identification service is currently unavailable. Your specimen data has been saved locally.',
      needsMoreEvidence: false,
      isOfflineFallback: true,
      rawData: null,
    };
  }

  // 4. Final halt / confidence assembly
  const combinedScore = plan.evidenceScore * 0.3 + modelConfidence * 0.7;
  const band = scoreToBand(combinedScore);

  // Merge evidence: plan evidence + model-observed features
  const modelFeatures = (rawData?.observed_features || []).map((f) => ({
    type: 'feature', label: f.feature, value: f.value, weight: 0.05,
  }));
  const allEvidence = [...plan.evidenceList, ...modelFeatures];

  const uncertainties = Array.isArray(rawData?.uncertainty) ? rawData.uncertainty : [];
  if (band === 'low') uncertainties.push('Confidence too low to finalise — re-scan recommended');

  return {
    primaryResult: rawData.primary_result || 'Unknown',
    confidenceBand: band,
    confidenceScore: combinedScore,
    evidenceUsed: allEvidence,
    uncertainties,
    improvementHints: plan.hints,
    recommendedAction: recommendAction({ band, task, isOffline, needsMoreEvidence: false }),
    reasoningSummary: rawData.reasoning || '',
    needsMoreEvidence: band === 'low',
    isOfflineFallback: isOffline,
    rawData,
  };
}