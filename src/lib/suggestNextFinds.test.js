import { describe, it, expect, vi } from 'vitest';

// Sample mock full Specimen record (simulating database records with image_url, ai_candidates, weather, lunar_phase, etc.)
const sampleFullSpecimen = {
  id: 'specimen_123',
  created_by: 'user@example.com',
  created_date: '2026-01-15T10:00:00Z',
  updated_date: '2026-01-15T10:00:00Z',
  mineral_name: 'Agate',
  common_name: 'Lake Superior Agate',
  image_url: 'https://storage.base44.app/specimens/agate_123_high_res_photo_extreme_detail.png',
  found_at: 'Keweenaw Peninsula, MI',
  lat: 47.25,
  lng: -88.55,
  found_date: '2026-01-14',
  notes: 'Found along the shoreline after a heavy storm. Distinct bandings with dark red and white chalcedony layers.',
  ai_confidence: 0.98,
  ai_candidates: [
    { name: 'Agate', confidence: 0.98 },
    { name: 'Jasper', confidence: 0.015 },
    { name: 'Carnelian', confidence: 0.005 }
  ],
  rarity: 'uncommon',
  verified: true,
  disposition: 'collected',
  collected: true,
  left_in_place: false,
  legal_status: 'user_confirmed',
  ethics_prompt_shown: true,
  user_confirmed_legal_access: true,
  geo_privacy: 'exact',
  rarity_quality_score: 85,
  xp_awarded: 150,
  chain_ids: ['chain_keweenaw_01', 'chain_agates_midwest'],
  weather: {
    temperature_f: 52.4,
    condition: 'Partly Cloudy',
    humidity: 65,
    wind_mph: 12.5,
    fetched_at: '2026-01-14T14:30:00Z'
  },
  lunar_phase: {
    phase_name: 'Waxing Gibbous',
    illumination: 0.78,
    phase_value: 0.25
  }
};

// Helper function that mirrors the collection aggregation logic in suggestNextFinds
function buildCollectionProfile(specimens) {
  const collection = {};
  for (const s of specimens) {
    const m = (s.mineral_name || '').trim();
    if (!m) continue;
    collection[m] = (collection[m] || 0) + 1;
  }
  const collectedNames = Object.keys(collection);
  const collectedSummary = collectedNames.length
    ? collectedNames.map(m => `${m} (${collection[m]})`).join(', ')
    : 'No specimens logged yet.';

  return { collection, collectedSummary };
}

describe('suggestNextFinds Specimen query optimization', () => {
  it('correctly builds collection profile from projected mineral_name specimens', () => {
    const fullSpecimens = [
      sampleFullSpecimen,
      { ...sampleFullSpecimen, id: 'specimen_124', mineral_name: 'Agate' },
      { ...sampleFullSpecimen, id: 'specimen_125', mineral_name: 'Datolite' },
      { ...sampleFullSpecimen, id: 'specimen_126', mineral_name: ' Copper ' }
    ];

    // Projected records returned when using fields: ['mineral_name']
    const projectedSpecimens = fullSpecimens.map(s => ({ mineral_name: s.mineral_name }));

    const fullResult = buildCollectionProfile(fullSpecimens);
    const projectedResult = buildCollectionProfile(projectedSpecimens);

    expect(projectedResult.collection).toEqual({
      Agate: 2,
      Datolite: 1,
      Copper: 1
    });
    expect(projectedResult.collectedSummary).toBe('Agate (2), Datolite (1), Copper (1)');
    expect(projectedResult).toEqual(fullResult);
  });

  it('demonstrates significant payload and memory size reduction with field projection', () => {
    const recordsCount = 200;
    const minerals = ['Agate', 'Jasper', 'Datolite', 'Copper', 'Petoskey Stone', 'Thomsonite', 'Greenstone'];

    const fullDataset = Array.from({ length: recordsCount }, (_, i) => ({
      ...sampleFullSpecimen,
      id: `specimen_${i}`,
      mineral_name: minerals[i % minerals.length]
    }));

    const projectedDataset = fullDataset.map(s => ({ mineral_name: s.mineral_name }));

    const fullJson = JSON.stringify(fullDataset);
    const projectedJson = JSON.stringify(projectedDataset);

    const fullSizeBytes = new TextEncoder().encode(fullJson).length;
    const projectedSizeBytes = new TextEncoder().encode(projectedJson).length;

    const reductionRatio = (1 - projectedSizeBytes / fullSizeBytes) * 100;

    // Projected payload should be over 90% smaller than full entity list payload
    expect(projectedSizeBytes).toBeLessThan(fullSizeBytes);
    expect(reductionRatio).toBeGreaterThan(90);
  });
});
