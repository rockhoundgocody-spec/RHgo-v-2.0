import { describe, it, expect } from 'vitest';
import { ROCK_FIGHTERS, FIGHTER_EMOJI_MAP } from './ARRockBattle.jsx';

describe('ARRockBattle Performance & Data Structure', () => {
  it('maps battle winner mineral to fighter emoji correctly and efficiently', () => {
    // Create a mock dataset of 10,000 battles
    const mockBattles = Array.from({ length: 10000 }, (_, i) => ({
      winner_mineral: ROCK_FIGHTERS[i % ROCK_FIGHTERS.length].name,
      xp_awarded: 100,
      avatar_url_at_time: 'https://example.com/avatar.png',
    }));

    // Baseline approach: Array.find inside map
    const startBaseline = performance.now();
    const mappedBaseline = mockBattles.map(b => ({
      mineral: b.winner_mineral,
      emoji: ROCK_FIGHTERS.find(r => r.name === b.winner_mineral)?.emoji || '🪨',
      xp: b.xp_awarded,
      avatarUrl: b.avatar_url_at_time,
    }));
    const durationBaseline = performance.now() - startBaseline;

    // Optimized approach: Map lookup
    const startOptimized = performance.now();
    const mappedOptimized = mockBattles.map(b => ({
      mineral: b.winner_mineral,
      emoji: FIGHTER_EMOJI_MAP.get(b.winner_mineral) || '🪨',
      xp: b.xp_awarded,
      avatarUrl: b.avatar_url_at_time,
    }));
    const durationOptimized = performance.now() - startOptimized;

    // Verify correctness
    expect(mappedOptimized).toEqual(mappedBaseline);
    expect(mappedOptimized[0].emoji).toBe('🔷');
    expect(mappedOptimized[1].emoji).toBe('⚫');

    console.log(`[Benchmark] 10,000 battles emoji lookup - Baseline (.find): ${durationBaseline.toFixed(2)}ms, Optimized (Map): ${durationOptimized.toFixed(2)}ms`);
  });
});
