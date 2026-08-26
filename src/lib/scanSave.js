const RARITY_WEIGHTS = { common: 1, uncommon: 2, rare: 3, legendary: 5 };

export function applyGeoPrivacy(coords, privacy) {
  if (privacy === 'private') return { lat: null, lng: null };
  const lat = coords?.lat;
  const lng = coords?.lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { lat: null, lng: null };
  if (privacy === 'approximate') {
    return {
      lat: Math.round(lat * 100) / 100,
      lng: Math.round(lng * 100) / 100,
    };
  }
  return { lat, lng };
}

export function calculateRarityQualityScore(rarity, confidence) {
  const weight = RARITY_WEIGHTS[rarity] || 1;
  const numericConfidence = Number.isFinite(confidence) ? confidence : 0.5;
  return Math.round(weight * Math.min(1, Math.max(0, numericConfidence)) * 20);
}

export function buildSpecimenNotes(result) {
  return [
    result.description,
    result.scientific_name ? `Scientific name: ${result.scientific_name}` : null,
    result.chemical_formula ? `Formula: ${result.chemical_formula}` : null,
    result.crystal_system ? `Crystal system: ${result.crystal_system}` : null,
    result.hardness_mohs != null ? `Hardness: ${result.hardness_mohs} Mohs` : null,
    result.formation ? `Formation: ${result.formation}` : null,
    result.value_estimate ? `Value: ${result.value_estimate}` : null,
    result.fun_fact ? `Fun fact: ${result.fun_fact}` : null,
  ].filter(Boolean).join('\n\n');
}
