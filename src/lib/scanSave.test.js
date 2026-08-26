import { describe, expect, it } from 'vitest';
import {
  applyGeoPrivacy,
  buildSpecimenNotes,
  calculateRarityQualityScore,
} from './scanSave.js';

describe('applyGeoPrivacy', () => {
  const exact = { lat: 45.123456, lng: -85.987654 };

  it('removes coordinates for private saves', () => {
    expect(applyGeoPrivacy(exact, 'private')).toEqual({ lat: null, lng: null });
  });

  it('rounds both valid coordinates for approximate saves', () => {
    expect(applyGeoPrivacy(exact, 'approximate')).toEqual({ lat: 45.12, lng: -85.99 });
  });

  it('does not invent a partial coordinate when either value is invalid', () => {
    expect(applyGeoPrivacy({ lat: 45, lng: null }, 'approximate')).toEqual({ lat: null, lng: null });
    expect(applyGeoPrivacy({ lat: Number.NaN, lng: -85 }, 'exact')).toEqual({ lat: null, lng: null });
  });
});

describe('calculateRarityQualityScore', () => {
  it('weights rarity and clamps untrusted confidence values', () => {
    expect(calculateRarityQualityScore('legendary', 0.8)).toBe(80);
    expect(calculateRarityQualityScore('rare', 5)).toBe(60);
    expect(calculateRarityQualityScore('common', -1)).toBe(0);
    expect(calculateRarityQualityScore('unknown', undefined)).toBe(10);
  });
});

describe('buildSpecimenNotes', () => {
  it('retains available identification details without empty sections', () => {
    expect(buildSpecimenNotes({
      description: 'Glassy crystal',
      scientific_name: 'Quartz',
      hardness_mohs: 7,
      fun_fact: 'Piezoelectric',
    })).toBe('Glassy crystal\n\nScientific name: Quartz\n\nHardness: 7 Mohs\n\nFun fact: Piezoelectric');
  });
});
