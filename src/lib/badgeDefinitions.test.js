import { describe, it, expect } from 'vitest';
import { BADGES, computeBadgeMetrics, getBadgeDefinition, evaluateEarnedCodes } from './badgeDefinitions';

describe('Liquid Mineral Badge System - badgeDefinitions', () => {
  it('should contain all 15 required core badges', () => {
    const requiredCodes = [
      'crystal_whisperer',
      'trailblazer',
      'pathfinder',
      'master_of_stone',
      'sharp_eye',
      'rare_seeker',
      'shared_adventure',
      'vein_tracker',
      'perfect_strike',
      'memory_builder',
      'pocket_finder',
      'earth_chosen',
      'cartographer',
      'apex_hunter',
      'legend_of_lode',
    ];

    const definedCodes = BADGES.map(b => b.code);

    requiredCodes.forEach(code => {
      expect(definedCodes).toContain(code);
      const def = getBadgeDefinition(code);
      expect(def).toBeDefined();
      expect(def.code).toBe(code);
      expect(def.title).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(def.rarity).toBeTruthy();
      expect(def.material).toBeTruthy();
      expect(def.colorScheme).toBeTruthy();
      expect(def.icon).toBeTruthy();
      expect(typeof def.check).toBe('function');
      expect(typeof def.progress).toBe('function');
    });
  });

  it('should resolve legacy badge aliases via getBadgeDefinition', () => {
    const aliasMap = {
      first_find: 'crystal_whisperer',
      archivist_25: 'master_of_stone',
      globetrotter: 'cartographer',
    };

    Object.entries(aliasMap).forEach(([legacyCode, expectedCode]) => {
      const def = getBadgeDefinition(legacyCode);
      expect(def).toBeDefined();
      expect(def.code).toBe(expectedCode);
    });
  });

  it('should correctly evaluate earned badges for a set of specimens', () => {
    const mockSpecimens = [
      {
        id: '1',
        mineral_name: 'Amethyst',
        rarity: 'rare',
        ai_confidence: 0.95,
        found_at: 'Copper Harbor',
        created_date: '2026-08-01T10:00:00Z',
      },
    ];

    const earned = evaluateEarnedCodes(mockSpecimens);
    expect(earned).toContain('crystal_whisperer');
  });

  it('should correctly calculate progress for badges', () => {
    const trailblazer = getBadgeDefinition('trailblazer');
    const mockSpecimens = [
      { found_at: 'Site A' },
      { found_at: 'Site B' },
      { found_at: 'Site A' },
    ];

    const prog = trailblazer.progress(mockSpecimens);
    expect(prog.current).toBe(2);
    expect(prog.target).toBe(25);
  });

  it('computes reusable metrics without changing array-based badge callers', () => {
    const specimens = [
      { mineral_name: '__proto__', found_at: '__proto__', rarity: 'legendary', verified: true },
      { mineral_name: '__proto__', found_at: 'Site B', ai_confidence: 0.95 },
    ];
    const metrics = computeBadgeMetrics(specimens);

    expect(metrics.bestMineralCount).toBe(2);
    expect(metrics.uniqueLocationsCount).toBe(2);
    expect(getBadgeDefinition('earth_chosen').check(metrics)).toBe(true);
    expect(getBadgeDefinition('earth_chosen').check(specimens)).toBe(true);
  });

  it('normalizes unique days and tracks consecutive streaks', () => {
    const metrics = computeBadgeMetrics([
      { found_date: '2026-08-01T23:00:00Z' },
      { found_date: '2026-08-01T08:00:00Z' },
      { found_date: '2026-08-02' },
      { found_date: 'invalid' },
      { found_date: '2026-08-03' },
    ]);

    expect(metrics.maxDayStreak).toBe(3);
  });
});
