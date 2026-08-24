import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSpawns, RARITY_COLORS_MAP, RARITY_XP_MAP } from './spawnEngine.js';

describe('spawnEngine', () => {
  const mockLat = 37.7749;
  const mockLng = -122.4194;

  describe('generateSpawns input validation', () => {
    it('should return an empty array if lat or lng is missing or falsy', () => {
      expect(generateSpawns(null, mockLng)).toEqual([]);
      expect(generateSpawns(mockLat, null)).toEqual([]);
      expect(generateSpawns(undefined, undefined)).toEqual([]);
      expect(generateSpawns(0, mockLng)).toEqual([]);
      expect(generateSpawns(mockLat, 0)).toEqual([]);
    });
  });

  describe('generateSpawns spawn count and options', () => {
    it('should generate default count of 6 spawns when options are omitted', () => {
      const spawns = generateSpawns(mockLat, mockLng);
      expect(spawns).toHaveLength(6);
    });

    it('should generate specified spawn count when count option is provided', () => {
      const spawns = generateSpawns(mockLat, mockLng, { count: 4 });
      expect(spawns).toHaveLength(4);
    });

    it('should add 2 extra spawns when nearHotspot is true', () => {
      const normalSpawns = generateSpawns(mockLat, mockLng, { count: 6, nearHotspot: false });
      const hotspotSpawns = generateSpawns(mockLat, mockLng, { count: 6, nearHotspot: true });
      expect(normalSpawns).toHaveLength(6);
      expect(hotspotSpawns).toHaveLength(8);
    });
  });

  describe('generateSpawns output structure and properties', () => {
    it('should generate spawns with expected schema and values', () => {
      const spawns = generateSpawns(mockLat, mockLng);
      const validRarities = ['common', 'uncommon', 'rare', 'legendary'];

      spawns.forEach((spawn, index) => {
        expect(spawn).toHaveProperty('id');
        expect(spawn.id).toMatch(/^spawn_\d+_\d+$/);

        expect(typeof spawn.mineral_name).toBe('string');
        expect(spawn.mineral_name.length).toBeGreaterThan(0);

        expect(validRarities).toContain(spawn.rarity);
        expect(typeof spawn.is_shiny).toBe('boolean');

        const expectedBaseXp = RARITY_XP_MAP[spawn.rarity];
        const expectedXp = spawn.is_shiny ? expectedBaseXp * 2 : expectedBaseXp;
        expect(spawn.xp).toBe(expectedXp);

        expect(typeof spawn.lat).toBe('number');
        expect(typeof spawn.lng).toBe('number');

        expect(typeof spawn.expires_at).toBe('number');
        expect(spawn.expires_at).toBeGreaterThan(Date.now());

        expect(typeof spawn.already_collected).toBe('boolean');

        const expectedCatchChance =
          spawn.rarity === 'legendary' ? 0.35 :
          spawn.rarity === 'rare' ? 0.55 :
          spawn.rarity === 'uncommon' ? 0.70 : 0.85;
        expect(spawn.catch_chance).toBe(expectedCatchChance);

        expect(spawn.color).toBe(RARITY_COLORS_MAP[spawn.rarity].color);
        expect(spawn.glow).toBe(RARITY_COLORS_MAP[spawn.rarity].glow);
        expect(spawn.emoji).toBe(RARITY_COLORS_MAP[spawn.rarity].emoji);
      });
    });

    it('should offset spawn coordinates closer to center when nearHotspot is true', () => {
      const normalSpawns = generateSpawns(mockLat, mockLng, { nearHotspot: false });
      const hotspotSpawns = generateSpawns(mockLat, mockLng, { nearHotspot: true });

      // Calculate max coordinate deviation from center
      const normalMaxLatDiff = Math.max(...normalSpawns.map(s => Math.abs(s.lat - mockLat)));
      const hotspotMaxLatDiff = Math.max(...hotspotSpawns.map(s => Math.abs(s.lat - mockLat)));

      expect(normalMaxLatDiff).toBeLessThan(300 / 111320 + 0.0001);
      expect(hotspotMaxLatDiff).toBeLessThan(150 / 111320 + 0.0001);
    });
  });

  describe('determinism and time bucket shifts', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should generate identical spawns for identical location and time', () => {
      const spawnsRun1 = generateSpawns(mockLat, mockLng);
      const spawnsRun2 = generateSpawns(mockLat, mockLng);

      expect(spawnsRun1).toEqual(spawnsRun2);
    });

    it('should change spawn IDs and properties when time bucket changes (30 minutes)', () => {
      const initialSpawns = generateSpawns(mockLat, mockLng);

      // Advance time by 30 minutes
      vi.advanceTimersByTime(30 * 60 * 1000);

      const nextBucketSpawns = generateSpawns(mockLat, mockLng);

      expect(nextBucketSpawns[0].id).not.toEqual(initialSpawns[0].id);
    });
  });

  describe('collectedMinerals option', () => {
    it('should set already_collected to true if mineral name (case-insensitive) is in collectedMinerals set', () => {
      const initialSpawns = generateSpawns(mockLat, mockLng);
      const targetMineralName = initialSpawns[0].mineral_name;

      const collectedMinerals = new Set([targetMineralName.toLowerCase()]);
      const spawnsWithCollection = generateSpawns(mockLat, mockLng, { collectedMinerals });

      expect(spawnsWithCollection[0].already_collected).toBe(true);
    });

    it('should set already_collected to false if mineral name is not in collectedMinerals set', () => {
      const collectedMinerals = new Set(['unmatched_mineral_xyz']);
      const spawns = generateSpawns(mockLat, mockLng, { collectedMinerals });

      spawns.forEach(spawn => {
        expect(spawn.already_collected).toBe(false);
      });
    });
  });

  describe('exported constants', () => {
    it('should export valid RARITY_COLORS_MAP and RARITY_XP_MAP', () => {
      expect(RARITY_COLORS_MAP).toBeDefined();
      expect(RARITY_COLORS_MAP.common).toHaveProperty('color');
      expect(RARITY_COLORS_MAP.common).toHaveProperty('glow');
      expect(RARITY_COLORS_MAP.common).toHaveProperty('emoji');

      expect(RARITY_XP_MAP).toEqual({
        common: 50,
        uncommon: 150,
        rare: 400,
        legendary: 1200,
      });
    });
  });
});
