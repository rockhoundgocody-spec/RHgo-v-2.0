/**
 * Context Integrity Engine — scores the quality of the complete evidence
 * package BEFORE identification confidence is finalized.
 *
 * A visually plausible ID can be geologically impossible; this layer makes
 * missing evidence (GPS, geology, field tests, angles) reduce the maximum
 * confidence the system may claim, and names what evidence to gather next.
 */

const WEIGHTS = {
  image_quality: 0.30,   // model-reported 0-10 image quality
  viewing_angles: 0.10,  // number of usable photos
  gps: 0.15,             // GPS present
  geology: 0.15,         // geological map coverage found for location
  locality: 0.10,        // named locality / beach confidence
  field_tests: 0.15,     // user-provided field evidence
  condition: 0.05,       // wet/dry condition known
};

export interface Evidence {
  imageCount?: number;
  imageQualityScore?: number | null;
  hasGps?: boolean;
  geologyUnitCount?: number;
  hasLocality?: boolean;
  fieldTestCount?: number;
  conditionKnown?: boolean;
  contradictionCount?: number;
}

/**
 * evidence = {
 *   imageCount, imageQualityScore (0-10), hasGps, geologyUnitCount,
 *   hasLocality, fieldTestCount, conditionKnown, contradictionCount
 * }
 * Returns { score, grade, confidence_cap, factors, missing_evidence }
 */
export function computeContextIntegrity(evidence: Evidence = {}) {
  const {
    imageCount = 1,
    imageQualityScore = null,
    hasGps = false,
    geologyUnitCount = 0,
    hasLocality = false,
    fieldTestCount = 0,
    conditionKnown = false,
    contradictionCount = 0,
  } = evidence;

  const factors = {
    image_quality: imageQualityScore == null ? 0.5 : Math.max(0, Math.min(1, imageQualityScore / 10)),
    viewing_angles: Math.min(1, imageCount / 3),
    gps: hasGps ? 1 : 0,
    geology: geologyUnitCount > 0 ? 1 : 0,
    locality: hasLocality ? 1 : 0,
    field_tests: Math.min(1, fieldTestCount / 3),
    condition: conditionKnown ? 1 : 0,
  };

  let score = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    score += factors[key as keyof typeof factors] * weight;
  }
  // Each unresolved contradiction drains the score
  score = Math.max(0, score - contradictionCount * 0.15);
  score = Math.round(score * 100) / 100;

  const missing_evidence = [];
  if (factors.viewing_angles < 1) missing_evidence.push('Add more photo angles (3+ recommended)');
  if (!hasGps) missing_evidence.push('Enable GPS so local geology can be checked');
  if (hasGps && geologyUnitCount === 0) missing_evidence.push('No geological map coverage found for this location');
  if (!hasLocality) missing_evidence.push('Name the locality/beach where it was found');
  if (fieldTestCount === 0) missing_evidence.push('Run a field test (streak, hardness, magnetism)');
  if (!conditionKnown) missing_evidence.push('Note whether the specimen is wet or dry');
  if (factors.image_quality < 0.5) missing_evidence.push('Retake photo in better light / sharper focus');

  const grade = score >= 0.8 ? 'A' : score >= 0.65 ? 'B' : score >= 0.5 ? 'C' : score >= 0.35 ? 'D' : 'F';

  // Poor context caps the confidence the system may claim: 0.55 – 0.95
  const confidence_cap = Math.round((0.55 + score * 0.4) * 100) / 100;

  return { score, grade, confidence_cap, factors, missing_evidence };
}