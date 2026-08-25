import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateSpawns, RARITY_COLORS_MAP, RARITY_XP_MAP } from './spawnEngine.js';

describe('spawnEngine', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('input validation', () => {
    it('should return empty array when lat or lng is falsy or missing', () => {
      expect(generateSpawns(null, -122.4194)).toEqual([]);
      expect(generateSpawns(37.7749, null)).toEqual([]);
      expect(generateSpawns(undefined, -122.4194)).toEqual([]);
      expect(generateSpawns(37.7749, undefined)).toEqual([]);
      expect(generateSpawns(0, -122.4194)).toEqual([]);
      expect(generateSpawns(37.7749, 0)).toEqual([]);
      expect(generateSpawns()).toEqual([]);
    });
  });

  describe('spawn generation count and options', () => {
    it('should generate default count of 6 spawns when valid coordinates are provided', () => {
      const spawns = generateSpawns(37.7749, -122.4194);
      expect(spawns).toHaveLength(6);
    });

    it('should respect custom count option', () => {
      const spawns = generateSpawns(37.7749, -122.4194, { count: 10 });
      expect(spawns).toHaveLength(10);
    });

    it('should add 2 extra spawns when nearHotspot is true', () => {
      const defaultHotspotSpawns = generateSpawns(37.7749, -122.4194, { nearHotspot: true });
      expect(defaultHotspotSpawns).toHaveLength(8);

      const customHotspotSpawns = generateSpawns(37.7749, -122.4194, { count: 4, nearHotspot: true });
      expect(customHotspotSpawns).toHaveLength(6);
    });
  });

  describe('spawn property structure and validity', () => {
    it('should produce spawns with all required fields and correct calculations', () => {
      const spawns = generateSpawns(37.7749, -122.4194);
      const validRarities = ['common', 'uncommon', 'rare', 'legendary'];

      spawns.forEach((spawn, index) => {
        expect(spawn.id).toBeDefined();
        expect(spawn.id).toMatch(new RegExp(`^spawn_\\d+_${index}$`));
        expect(typeof spawn.mineral_name).toBe('string');
        expect(validRarities).toContain(spawn.rarity);
        expect(typeof spawn.is_shiny).toBe('boolean');

        const baseXP = RARITY_XP_MAP[spawn.rarity];
        const expectedXP = spawn.is_shiny ? baseXP * 2 : baseXP;
        expect(spawn.xp).toBe(expectedXP);

        const expectedCatchChance =
          spawn.rarity === 'legendary' ? 0.35 :
          spawn.rarity === 'rare' ? 0.55 :
          spawn.rarity === 'uncommon' ? 0.70 : 0.85;
        expect(spawn.catch_chance).toBe(expectedCatchChance);

        const colorMap = RARITY_COLORS_MAP[spawn.rarity];
        expect(spawn.color).toBe(colorMap.color);
        expect(spawn.glow).toBe(colorMap.glow);
        expect(spawn.emoji).toBe(colorMap.emoji);

        expect(typeof spawn.lat).toBe('number');
        expect(typeof spawn.lng).toBe('number');
        expect(typeof spawn.expires_at).toBe('number');
        expect(typeof spawn.already_collected).toBe('boolean');
      });
    });
  });

  describe('collected minerals status', () => {
    it('should set already_collected to true if collectedMinerals contains the lower-case mineral name', () => {
      const collected = new Set(['quartz', 'calcite', 'agate', 'amethyst', 'native gold']);
      const spawns = generateSpawns(37.7749, -122.4194, { collectedMinerals: collected });

      spawns.forEach((spawn) => {
        const isCollectedInSet = collected.has(spawn.mineral_name.toLowerCase());
        expect(spawn.already_collected).toBe(isCollectedInSet);
      });
    });

    it('should default already_collected to false when collectedMinerals is empty', () => {
      const spawns = generateSpawns(37.7749, -122.4194);
      spawns.forEach((spawn) => {
        expect(spawn.already_collected).toBe(false);
      });
    });
  });

  describe('coordinate offset boundaries', () => {
    it('should offset coordinates within maxMeters range for standard spawns (300m)', () => {
      const baseLat = 37.7749;
      const baseLng = -122.4194;
      const maxDegreeOffset = 300 / 111320; // ~0.002695 degrees

      const spawns = generateSpawns(baseLat, baseLng, { nearHotspot: false });

      spawns.forEach((spawn) => {
        expect(spawn.lat).toBeGreaterThanOrEqual(baseLat - maxDegreeOffset);
        expect(spawn.lat).toBeLessThanOrEqual(baseLat + maxDegreeOffset);
        expect(spawn.lng).toBeGreaterThanOrEqual(baseLng - maxDegreeOffset);
        expect(spawn.lng).toBeLessThanOrEqual(baseLng + maxDegreeOffset);
      });
    });

    it('should offset coordinates within tighter maxMeters range for hotspot spawns (150m)', () => {
      const baseLat = 37.7749;
      const baseLng = -122.4194;
      const maxDegreeOffset = 150 / 111320; // ~0.001347 degrees

      const spawns = generateSpawns(baseLat, baseLng, { nearHotspot: true });

      spawns.forEach((spawn) => {
        expect(spawn.lat).toBeGreaterThanOrEqual(baseLat - maxDegreeOffset);
        expect(spawn.lat).toBeLessThanOrEqual(baseLat + maxDegreeOffset);
        expect(spawn.lng).toBeGreaterThanOrEqual(baseLng - maxDegreeOffset);
        expect(spawn.lng).toBeLessThanOrEqual(baseLng + maxDegreeOffset);
      });
    });
  });

  describe('determinism and time bucket refresh', () => {
    it('should return identical spawns when called with same parameters at same time', () => {
      const lat = 37.7749;
      const lng = -122.4194;

      const spawns1 = generateSpawns(lat, lng);
      const spawns2 = generateSpawns(lat, lng);

      expect(spawns1).toEqual(spawns2);
    });

    it('should generate different spawn IDs and seeds when time advances past 30-minute bucket', () => {
      vi.useFakeTimers();
      const initialTime = new Date('2026-01-01T12:00:00Z').getTime();
      vi.setSystemTime(initialTime);

      const spawnsBucket1 = generateSpawns(37.7749, -122.4194);

      // Advance time by 31 minutes to move to next time bucket
      vi.setSystemTime(initialTime + 31 * 60 * 1000);

      const spawnsBucket2 = generateSpawns(37.7749, -122.4194);

      expect(spawnsBucket1[0].id).not.toBe(spawnsBucket2[0].id);
      expect(spawnsBucket1[0].expires_at).not.toBe(spawnsBucket2[0].expires_at);
    });
  });

  describe('exported mappings', () => {
    it('should export RARITY_COLORS_MAP with correct rarity keys', () => {
      expect(RARITY_COLORS_MAP).toHaveProperty('common');
      expect(RARITY_COLORS_MAP).toHaveProperty('uncommon');
      expect(RARITY_COLORS_MAP).toHaveProperty('rare');
      expect(RARITY_COLORS_MAP).toHaveProperty('legendary');
    });

    it('should export RARITY_XP_MAP with correct XP values', () => {
      expect(RARITY_XP_MAP).toEqual({
        common: 50,
        uncommon: 150,
        rare: 400,
        legendary: 1200,
      });
    });
  });
});
