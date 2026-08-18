import { describe, it, expect } from 'vitest';
import { processLeaderboardData } from './getLeaderboardLogic';

describe('processLeaderboardData', () => {
  it('correctly aggregates specimen counts, unique minerals, and collection weights per user', () => {
    const users = [
      { id: 'user1', full_name: 'Alice Quartz', email: 'alice@example.com' },
      { id: 'user2', full_name: '', email: 'bob@example.com' },
    ];

    const profiles = [
      { owner_email: 'alice@example.com', avatar_url: 'https://example.com/alice.jpg' },
    ];

    const specimens = [
      { created_by_id: 'user1', mineral_name: 'Quartz', notes: 'Large crystal with high clarity', weather: { temperature_f: 72 } },
      { created_by_id: 'user1', mineral_name: 'quartz ', notes: 'Another sample', lunar_phase: { phase_name: 'Full' } },
      { created_by_id: 'user1', mineral_name: 'Agate', notes: 'Lake Superior Agate' },
      { created_by_id: 'user2', mineral_name: 'Calcite' },
    ];

    const weights = [
      { owner_email: 'alice@example.com', total_weight_lbs: 12.4, description: '2025 finds' },
      { owner_email: 'alice@example.com', total_weight_lbs: 5.1, description: '2026 finds' },
      { owner_email: 'bob@example.com', total_weight_lbs: 3.0 },
    ];

    const result = processLeaderboardData({ specimens, weights, users, profiles });

    expect(result.total_collectors).toBe(2);
    const aliceRow = result.rows.find(r => r.user_id === 'user1');
    expect(aliceRow).toEqual({
      user_id: 'user1',
      name: 'Alice Quartz',
      email: 'alice@example.com',
      avatar_url: 'https://example.com/alice.jpg',
      unique_minerals: 2, // 'quartz', 'agate'
      specimen_count: 3,
      total_weight_lbs: 17.5,
    });

    const bobRow = result.rows.find(r => r.user_id === 'user2');
    expect(bobRow).toEqual({
      user_id: 'user2',
      name: 'bob',
      email: 'bob@example.com',
      avatar_url: null,
      unique_minerals: 1,
      specimen_count: 1,
      total_weight_lbs: 3.0,
    });
  });

  it('demonstrates significant payload size and memory savings when selecting sparse fields', () => {
    // Generate 5,000 full records vs 5,000 sparse records
    const fullSpecimens = Array.from({ length: 5000 }, (_, i) => ({
      id: `specimen_${i}`,
      created_by_id: `user_${i % 100}`,
      mineral_name: `Mineral_${i % 50}`,
      common_name: `Common Mineral Name ${i}`,
      image_url: `https://storage.base44.app/bucket/specimens/image_${i}_highres.jpg`,
      found_at: `Location Coordinates Sector ${i}, Upper Peninsula, MI`,
      lat: 46.5432 + (i % 100) * 0.001,
      lng: -87.3952 - (i % 100) * 0.001,
      found_date: '2026-07-15',
      notes: 'Detailed notes about the rock formation, surrounding geology, legal permissions obtained, and UV luminescence under 365nm light.',
      ai_confidence: 0.985,
      ai_candidates: [{ name: 'Agate', confidence: 0.985 }, { name: 'Jasper', confidence: 0.01 }],
      rarity: 'rare',
      verified: true,
      disposition: 'collected',
      collected: true,
      left_in_place: false,
      legal_status: 'user_confirmed',
      ethics_prompt_shown: true,
      user_confirmed_legal_access: true,
      geo_privacy: 'approximate',
      rarity_quality_score: 87.5,
      xp_awarded: 250,
      chain_ids: [`chain_${i % 10}`],
      weather: { temperature_f: 68.5, condition: 'Partly Cloudy', humidity: 55, wind_mph: 8.2, fetched_at: '2026-07-15T14:30:00Z' },
      lunar_phase: { phase_name: 'Waxing Gibbous', illumination: 0.78, phase_value: 0.25 },
    }));

    const sparseSpecimens = fullSpecimens.map(s => ({
      created_by_id: s.created_by_id,
      mineral_name: s.mineral_name,
    }));

    const fullSize = JSON.stringify(fullSpecimens).length;
    const sparseSize = JSON.stringify(sparseSpecimens).length;
    const reductionPercent = ((fullSize - sparseSize) / fullSize) * 100;

    console.log(`[Benchmark] Full Specimen payload size (5,000 records): ${(fullSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`[Benchmark] Sparse Specimen payload size (5,000 records): ${(sparseSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`[Benchmark] Payload size reduction: ${reductionPercent.toFixed(1)}%`);

    expect(sparseSize).toBeLessThan(fullSize);
    expect(reductionPercent).toBeGreaterThan(80); // Over 80% network/memory payload reduction

    // Verify processing on sparse fields gives exact same result as full fields
    const resFull = processLeaderboardData({ specimens: fullSpecimens });
    const resSparse = processLeaderboardData({ specimens: sparseSpecimens });

    expect(resSparse).toEqual(resFull);
  });
});
