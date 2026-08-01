/**
 * Essence Algorithm — the mathematical core of specimen identification.
 *
 * Tier 3 — Spatial Bayesian fusion:
 *   P(M_i | V, L, D) = P(V|M_i) · P(L|M_i) · P(D|M_i) · P(M_i) / P(V,L,D)
 *   where P(V,L,D) is the marginal normalization constant summed over all
 *   candidate species.
 *
 * Tier 2 trigger — Visual classification entropy:
 *   H(M) = -Σ p_i · log2(p_i)
 *   When H(M) exceeds 1.2 bits, the visual result is too ambiguous and the
 *   system triggers Dynamic Diagnostic Field Testing (Mohs, streak, UV).
 */

export const ENTROPY_TRIGGER_BITS = 1.2;

interface Candidate {
  name?: string;
  confidence?: number;
}

/**
 * Compute the posterior distribution and entropy over candidate species.
 *
 * candidates            — visual likelihoods P(V|M_i) from the vision model
 * locationLikelihoods   — P(L|M_i): spatial priors (beach/geology boosts), default 1
 * diagnosticLikelihoods — P(D|M_i): physical test likelihoods, default 1
 * priors                — P(M_i): base occurrence rates, default uniform
 */
export function computeEssence({
  candidates = [],
  locationLikelihoods = {},
  diagnosticLikelihoods = {},
  priors = {},
}: {
  candidates?: Candidate[];
  locationLikelihoods?: Record<string, number>;
  diagnosticLikelihoods?: Record<string, number>;
  priors?: Record<string, number>;
}) {
  const valid = candidates.filter((c) => c.name);
  if (!valid.length) {
    return { entropy_bits: 0, tier2_triggered: false, posterior: [], top: null };
  }

  // Joint likelihood P(V|M)·P(L|M)·P(D|M)·P(M) per candidate
  const raw = valid.map((c) => {
    const pV = Math.max(1e-6, Number(c.confidence) || 0.01);
    const pL = locationLikelihoods[c.name!] ?? 1;
    const pD = diagnosticLikelihoods[c.name!] ?? 1;
    const pM = priors[c.name!] ?? 1;
    return { name: c.name!, joint: pV * pL * pD * pM };
  });

  // Marginal normalization constant P(V,L,D) = Σ joints
  const Z = raw.reduce((s, x) => s + x.joint, 0) || 1;
  const posterior = raw
    .map((x) => ({ name: x.name, probability: Math.round((x.joint / Z) * 1000) / 1000 }))
    .sort((a, b) => b.probability - a.probability);

  // Shannon entropy H(M) in bits over the posterior
  const H = -posterior.reduce(
    (s, p) => (p.probability > 0 ? s + p.probability * Math.log2(p.probability) : s),
    0
  );
  const entropy_bits = Math.round(H * 1000) / 1000;

  return {
    entropy_bits,
    entropy_trigger_bits: ENTROPY_TRIGGER_BITS,
    tier2_triggered: entropy_bits > ENTROPY_TRIGGER_BITS,
    posterior,
    top: posterior[0] || null,
  };
}