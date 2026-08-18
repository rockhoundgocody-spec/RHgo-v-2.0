import { describe, it, expect } from 'vitest';
import {
  calculateSpawnPosition,
  getPinSize,
  DailyCapBanner,
  HeatRings,
  SpawnTooltip,
  default as SpawnMapLayer
} from './SpawnMapLayer.jsx';

describe('SpawnMapLayer helper functions', () => {
  describe('calculateSpawnPosition', () => {
    it('should calculate correct center position for index 0 out of 4 with common rarity', () => {
      const pos = calculateSpawnPosition(0, 4, 'common');
      expect(pos.x).toBeCloseTo(78, 4);
      expect(pos.y).toBeCloseTo(48, 4);
      expect(pos.rarityIdx).toBe(0);
    });

    it('should calculate correct position for legendary rarity', () => {
      const pos = calculateSpawnPosition(0, 4, 'legendary');
      expect(pos.x).toBeCloseTo(102, 4);
      expect(pos.rarityIdx).toBe(3);
    });

    it('should handle unknown rarity gracefully with default rarity index 0', () => {
      const pos = calculateSpawnPosition(1, 4, 'unknown_rarity');
      expect(pos.rarityIdx).toBe(0);
    });

    it('should handle totalSpawns equal to 0 without division by zero errors', () => {
      const pos = calculateSpawnPosition(0, 0, 'common');
      expect(pos.x).toBeCloseTo(78, 4);
      expect(pos.y).toBeCloseTo(48, 4);
    });
  });

  describe('getPinSize', () => {
    it('should return 46 for legendary rarity', () => {
      expect(getPinSize('legendary')).toBe(46);
    });

    it('should return 40 for rare rarity', () => {
      expect(getPinSize('rare')).toBe(40);
    });

    it('should return 34 for common and uncommon rarity', () => {
      expect(getPinSize('common')).toBe(34);
      expect(getPinSize('uncommon')).toBe(34);
      expect(getPinSize('other')).toBe(34);
    });
  });
});

describe('SpawnMapLayer subcomponents', () => {
  it('should render DailyCapBanner element tree', () => {
    const banner = DailyCapBanner();
    expect(banner).not.toBeNull();
    expect(banner.type).toBe('div');
  });

  it('should render HeatRings element tree', () => {
    const rings = HeatRings();
    expect(rings).not.toBeNull();
  });

  it('should render SpawnTooltip element tree', () => {
    const mockSpawn = { color: '#ff0000', mineral_name: 'Quartz', xp: 50, is_shiny: true };
    const tooltip = SpawnTooltip({ spawn: mockSpawn });
    expect(tooltip).not.toBeNull();
  });
});

describe('SpawnMapLayer component pure behavior', () => {
  it('should return null when spawns array is empty', () => {
    const result = SpawnMapLayer({ spawns: [] });
    expect(result).toBeNull();
  });

  it('should return element tree when spawns array contains items', () => {
    const mockSpawns = [
      { id: '1', rarity: 'rare', glow: '#ff0000', color: '#ff0000', emoji: '💎', mineral_name: 'Quartz', xp: 50 }
    ];
    const result = SpawnMapLayer({ spawns: mockSpawns, caughtToday: 0, dailyCap: 10 });
    expect(result).not.toBeNull();
    expect(result.type).toBe('div');
  });

  it('should render DailyCapBanner when caughtToday >= dailyCap', () => {
    const mockSpawns = [
      { id: '1', rarity: 'rare', glow: '#ff0000', color: '#ff0000', emoji: '💎', mineral_name: 'Quartz', xp: 50 }
    ];
    const result = SpawnMapLayer({ spawns: mockSpawns, caughtToday: 10, dailyCap: 10 });
    expect(result).not.toBeNull();
    // DailyCapBanner is conditionally included when cappedOut is true
    const children = result.props.children;
    expect(children[0]).not.toBe(false);
  });
});
