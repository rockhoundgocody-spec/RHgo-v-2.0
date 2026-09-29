import { describe, it, expect } from 'vitest';
import {
  LEVEL_TITLES,
  levelThreshold,
  getLevel,
  getTitle,
  xpProgress,
  xpToNext,
} from './leveling.js';

describe('leveling module', () => {
  describe('LEVEL_TITLES', () => {
    it('contains expected titles in order', () => {
      expect(LEVEL_TITLES).toEqual([
        'Pebble Scout',
        'Crystal Apprentice',
        'Geode Guardian',
        'Titan Rockhound',
        'Legendary Specimen Hunter',
        'Mythic Earth Wizard',
      ]);
      expect(LEVEL_TITLES.length).toBe(6);
    });
  });

  describe('levelThreshold', () => {
    it.each([
      { level: -1, expected: 0 },
      { level: 0, expected: 0 },
      { level: 1, expected: 0 },
      { level: 2, expected: 1500 },
      { level: 3, expected: 3600 },
      { level: 4, expected: 6540 },
      { level: 5, expected: 10656 },
      { level: 6, expected: 16418 },
      { level: 7, expected: 24486 },
    ])('returns threshold $expected for level $level', ({ level, expected }) => {
      expect(levelThreshold(level)).toBe(expected);
    });
  });

  describe('getLevel', () => {
    it.each([
      { xp: -100, expectedLevel: 1 },
      { xp: 0, expectedLevel: 1 },
      { xp: 1499, expectedLevel: 1 },
      { xp: 1500, expectedLevel: 2 },
      { xp: 3599, expectedLevel: 2 },
      { xp: 3600, expectedLevel: 3 },
      { xp: 6539, expectedLevel: 3 },
      { xp: 6540, expectedLevel: 4 },
      { xp: 10655, expectedLevel: 4 },
      { xp: 10656, expectedLevel: 5 },
      { xp: 16417, expectedLevel: 5 },
      { xp: 16418, expectedLevel: 6 },
      { xp: 50000, expectedLevel: 6 },
    ])('maps $xp XP to level $expectedLevel', ({ xp, expectedLevel }) => {
      expect(getLevel(xp)).toBe(expectedLevel);
    });
  });

  describe('getTitle', () => {
    it.each([
      { level: 1, expectedTitle: 'Pebble Scout' },
      { level: 2, expectedTitle: 'Crystal Apprentice' },
      { level: 3, expectedTitle: 'Geode Guardian' },
      { level: 4, expectedTitle: 'Titan Rockhound' },
      { level: 5, expectedTitle: 'Legendary Specimen Hunter' },
      { level: 6, expectedTitle: 'Mythic Earth Wizard' },
      { level: 10, expectedTitle: 'Mythic Earth Wizard' },
    ])('returns "$expectedTitle" for level $level', ({ level, expectedTitle }) => {
      expect(getTitle(level)).toBe(expectedTitle);
    });
  });

  describe('xpProgress', () => {
    it.each([
      { xp: -500, expectedProgress: 0 },
      { xp: 0, expectedProgress: 0 },
      { xp: 750, expectedProgress: 50 },
      { xp: 1500, expectedProgress: 0 },
      { xp: 2550, expectedProgress: 50 },
      { xp: 16418, expectedProgress: 100 },
      { xp: 25000, expectedProgress: 100 },
    ])('calculates progress $expectedProgress% for $xp XP', ({ xp, expectedProgress }) => {
      expect(xpProgress(xp)).toBeCloseTo(expectedProgress, 5);
    });
  });

  describe('xpToNext', () => {
    it.each([
      { xp: 0, expectedRemaining: 1500 },
      { xp: 750, expectedRemaining: 750 },
      { xp: 1500, expectedRemaining: 2100 },
      { xp: 2550, expectedRemaining: 1050 },
      { xp: 16418, expectedRemaining: 0 },
      { xp: 25000, expectedRemaining: 0 },
    ])('calculates remaining XP $expectedRemaining for $xp XP', ({ xp, expectedRemaining }) => {
      expect(xpToNext(xp)).toBe(expectedRemaining);
    });
  });
});
