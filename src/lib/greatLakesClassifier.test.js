import { describe, it, expect } from 'vitest';
import { buildGreatLakesPromptContext, getLocationPriors, offlineClassify } from './greatLakesClassifier';

describe('getLocationPriors', () => {
  it('returns empty array when no location is provided', () => {
    expect(getLocationPriors()).toEqual([]);
    expect(getLocationPriors('', '')).toEqual([]);
  });

  it('returns priors for specific beach names', () => {
    const priors = getLocationPriors('Grand Marais', 'MI');
    expect(priors.length).toBeGreaterThan(0);
    expect(priors.some(p => p.name === 'Thomsonite')).toBe(true);
    expect(priors.some(p => p.name === 'Lake Superior Agate')).toBe(true);
  });

  it('returns regional boosts for Lake Superior area', () => {
    const priors = getLocationPriors('', 'Upper Peninsula');
    expect(priors.some(p => p.name === 'Native Copper')).toBe(true);
  });

  it('returns regional boosts for Lake Michigan area', () => {
    const priors = getLocationPriors('Petoskey', 'MI');
    expect(priors.some(p => p.name === 'Petoskey Stone')).toBe(true);
  });
});

describe('buildGreatLakesPromptContext', () => {
  it('handles empty input object correctly', () => {
    const result = buildGreatLakesPromptContext({});
    expect(result).toContain('GREAT LAKES REGIONAL SPECIALIST MODE');
    expect(result).toContain('CONSTRAIN your ID to this 30-class list');
    expect(result).toContain('WATER-WORN SURFACE NOTE');
    // Should NOT contain specific notes
    expect(result).not.toContain('USER LOCATION');
    expect(result).not.toContain('Boost probability for');
    expect(result).not.toContain('Specimen is WET');
    expect(result).not.toContain('Specimen is DRY');
    expect(result).not.toContain('Recent storm conditions');
    expect(result).not.toContain('Spring thaw');
  });

  it('includes location when provided', () => {
    const result = buildGreatLakesPromptContext({ beachName: 'Grand Marais', state: 'MI' });
    expect(result).toContain('USER LOCATION: Grand Marais, MI');
    expect(result).toContain('Boost probability for:');
    expect(result).toContain('Thomsonite');
  });

  it('includes wet/dry notes', () => {
    const wetResult = buildGreatLakesPromptContext({ wetDry: 'wet' });
    expect(wetResult).toContain('Specimen is WET');

    const dryResult = buildGreatLakesPromptContext({ wetDry: 'dry' });
    expect(dryResult).toContain('Specimen is DRY');
  });

  it('includes storm notes', () => {
    const result = buildGreatLakesPromptContext({ postStorm: true });
    expect(result).toContain('Recent storm conditions');
  });

  it('includes seasonal notes', () => {
    const springResult = buildGreatLakesPromptContext({ season: 'spring' });
    expect(springResult).toContain('Spring thaw');

    const winterResult = buildGreatLakesPromptContext({ season: 'winter' });
    expect(winterResult).toContain('Winter conditions');
  });
});

describe('offlineClassify', () => {
  it('returns top 3 candidates', () => {
    const result = offlineClassify({ colorKeywords: ['red', 'orange'], luster: 'waxy' });
    expect(result.length).toBe(3);
    expect(result[0].name).toBe('Lake Superior Agate');
    expect(result[0].offline).toBe(true);
  });

  it('handles metallic luster for copper', () => {
    const result = offlineClassify({ colorKeywords: ['copper'], luster: 'metallic' });
    expect(result[0].name).toBe('Native Copper');
  });

  it('applies location priors in offline classification', () => {
    const result = offlineClassify({ colorKeywords: ['green'], beachName: 'Isle Royale' });
    expect(result.some(r => r.name === 'Chlorastrolite (Greenstone)')).toBe(true);
  });
});
