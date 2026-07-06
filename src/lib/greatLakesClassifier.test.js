import { describe, it, expect } from 'vitest';
import { offlineClassify } from './greatLakesClassifier';

describe('offlineClassify', () => {
  it('should return exactly 3 items when there are multiple matches', () => {
    // 'red' matches Lake Superior Agate, Jasper, Carnelian, Jacobsville Sandstone
    const results = offlineClassify({ colorKeywords: ['red'] });
    expect(results).toHaveLength(3);
  });

  it('should sort results by confidence in descending order', () => {
    // Native Copper: 0.45 (color) + 0 (dry clue doesn't have metallic) = 0.45
    // Copper Ore: 0.45 (color) = 0.45
    // Leland Blue: 0.4 (color) = 0.4
    // Wait, let's use wet to get more distinction.
    // Native Copper (wet): 0.45 (color) + 0.25 (luster) = 0.7 -> 0.55 confidence
    // Leland Blue (wet): 0.4 (color) = 0.4
    // Copper Ore (wet): 0.45 (color) = 0.45
    const results = offlineClassify({ colorKeywords: ['blue', 'metallic'], luster: 'metallic', wetDry: 'wet' });

    expect(results[0].confidence).toBeGreaterThanOrEqual(results[1].confidence);
    expect(results[1].confidence).toBeGreaterThanOrEqual(results[2].confidence);

    expect(results[0].name).toBe('Native Copper');
    expect(results[1].name).toBe('Copper Ore (Conglomerate)');
    expect(results[2].name).toBe('Leland Blue');
  });

  it('should cap confidence at 0.55', () => {
    // Native Copper (wet) gets 0.7 total score
    const results = offlineClassify({ colorKeywords: ['metallic'], luster: 'metallic', wetDry: 'wet' });
    expect(results[0].name).toBe('Native Copper');
    expect(results[0].confidence).toBe(0.55);
  });

  it('should return wet clues when wetDry is "wet"', () => {
    const results = offlineClassify({ colorKeywords: ['blue'], wetDry: 'wet' });
    const lelandBlue = results.find(r => r.name === 'Leland Blue');
    expect(lelandBlue.field_clue).toBe('Vivid blue-green glassy slag, smooth');
  });

  it('should return dry clues when wetDry is "dry"', () => {
    const results = offlineClassify({ colorKeywords: ['blue'], wetDry: 'dry' });
    const lelandBlue = results.find(r => r.name === 'Leland Blue');
    expect(lelandBlue.field_clue).toBe('Frosty blue-green, dull surface');
  });

  it('should apply location prior boosts', () => {
    // Without priors
    const noPriors = offlineClassify({ colorKeywords: ['red'] });
    const agateNoPrior = noPriors.find(r => r.name === 'Lake Superior Agate');

    // With priors (Grand Marais is in Agate's beaches)
    const withPriors = offlineClassify({ colorKeywords: ['red'], beachName: 'Grand Marais' });
    const agateWithPrior = withPriors.find(r => r.name === 'Lake Superior Agate');

    expect(agateWithPrior.confidence).toBeGreaterThan(agateNoPrior.confidence);
    expect(agateWithPrior.confidence).toBeCloseTo(0.45);
  });

  it('should return 3 results even with no keyword matches', () => {
    const results = offlineClassify({ colorKeywords: ['unknown-material-xyz'] });
    expect(results).toHaveLength(3);
    expect(results.every(r => r.confidence === 0)).toBe(true);
  });
});
