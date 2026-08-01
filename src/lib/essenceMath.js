/**
 * Essence Algorithm math — patent-spec formulas.
 *
 * Tier 3: Spatial Bayesian fusion
 *   P(Mi | V, L, D) = P(V|Mi) · P(L|Mi) · P(D|Mi) · P(Mi) / P(V, L, D)
 *
 * Tier 2 trigger: Visual classification entropy
 *   H(M) = -Σ p·log2(p) — when H > 1.2 bits, diagnostic field testing is required.
 */

export const ENTROPY_TRIGGER_BITS = 1.2;

export const DISCLAIMERS = {
  identification: 'AI identification is probabilistic, not definitive. Confirm with physical diagnostic tests (hardness, streak, UV) before relying on it.',
  value: 'Value estimates are informational only and do not constitute an appraisal.',
  safety: 'Never taste, inhale dust from, or break specimens that could contain hazardous minerals (asbestos, mercury, uranium, lead, arsenic).',
};

/** Normalized posterior over candidates. spatialBoost/diagnosticBoost map name → likelihood multiplier. */
export function computePosterior(candidates = [], { spatialBoost = {}, diagnosticBoost = {}, priors = {} } = {}) {
  const cands = (candidates || []).filter((c) => c?.name && typeof c.confidence === 'number');
  if (!cands.length) return [];
  const weights = cands.map((c) => ({
    name: c.name,
    w: Math.max(c.confidence, 0.001) * (spatialBoost[c.name] ?? 1) * (diagnosticBoost[c.name] ?? 1) * (priors[c.name] ?? 1),
  }));
  const Z = weights.reduce((s, x) => s + x.w, 0) || 1; // marginal normalization constant
  return weights.map((x) => ({ name: x.name, posterior: x.w / Z })).sort((a, b) => b.posterior - a.posterior);
}

/** H(M) in bits over normalized candidate confidences. */
export function visualEntropyBits(candidates = []) {
  const ps = (candidates || []).map((c) => c?.confidence).filter((p) => typeof p === 'number' && p > 0);
  if (ps.length < 2) return 0;
  const Z = ps.reduce((s, p) => s + p, 0);
  return -ps.reduce((s, p) => {
    const q = p / Z;
    return s + q * Math.log2(q);
  }, 0);
}

export function tier2Triggered(candidates) {
  return visualEntropyBits(candidates) > ENTROPY_TRIGGER_BITS;
}

/** Evidence integrity grade — client mirror of the backend Context Integrity Engine. */
export function evidenceGrade({ imageQuality = null, hasGps = false, geologicalPlausibility = null, angleCount = 1, conditionKnown = false }) {
  let score = 0;
  score += (imageQuality ?? 0.5) * 0.35;
  score += hasGps ? 0.2 : 0;
  score += (geologicalPlausibility ?? 0.5) * 0.2;
  score += (Math.min(angleCount, 3) / 3) * 0.15;
  score += conditionKnown ? 0.1 : 0;
  const grade = score >= 0.85 ? 'A' : score >= 0.7 ? 'B' : score >= 0.55 ? 'C' : score >= 0.4 ? 'D' : 'F';
  const missing = [];
  if (!hasGps) missing.push('Add GPS location to enable spatial priors');
  if ((imageQuality ?? 0) < 0.6) missing.push('Retake in better light for a sharper read');
  if (angleCount < 2) missing.push('Capture more angles for stronger evidence');
  if (!conditionKnown) missing.push('Mark wet/dry condition');
  // Confidence is capped by evidence quality — weak evidence can never claim certainty
  return { score, grade, missing, confidenceCap: 0.5 + score * 0.5 };
}