import { describe, it, expect } from 'vitest';
import { suggestBadgeTargets } from './badgeEvolution';

describe('suggestBadgeTargets', () => {
  it('should return an empty array for empty specimens', () => {
    expect(suggestBadgeTargets([])).toEqual([]);
  });

  it('should suggest mineral mastery badges', () => {
    const specimens = [
      { mineral_name: 'Quartz' },
      { mineral_name: 'Quartz' },
      { mineral_name: 'Fluorite' },
      { mineral_name: 'Fluorite' },
      { mineral_name: 'Fluorite' },
      { mineral_name: 'Fluorite' },
      { mineral_name: 'Fluorite' },
    ];
    const suggestions = suggestBadgeTargets(specimens);
    expect(suggestions).toContain('Quartz Pair');
    expect(suggestions).toContain('Fluorite Collector');
    expect(suggestions).not.toContain('Quartz Collector');
    expect(suggestions).not.toContain('Fluorite Pair');
  });

  it('should suggest collection pioneer for 5+ specimens', () => {
    const specimens = Array(5).fill({ mineral_name: 'Stone' });
    expect(suggestBadgeTargets(specimens)).toContain('Collection Pioneer');
  });

  it('should suggest serious collector for 25+ specimens', () => {
    const specimens = Array(25).fill({ mineral_name: 'Stone' });
    const suggestions = suggestBadgeTargets(specimens);
    expect(suggestions).toContain('Collection Pioneer');
    expect(suggestions).toContain('Serious Collector');
  });

  it('should suggest verified expert for 5+ verified specimens', () => {
    const specimens = Array(5).fill({ mineral_name: 'Stone', verified: true });
    expect(suggestBadgeTargets(specimens)).toContain('Verified Expert');
  });

  it('should suggest rare finder for 1+ rare specimens', () => {
    const specimens = [{ mineral_name: 'Diamond', rarity: 'rare' }];
    expect(suggestBadgeTargets(specimens)).toContain('Rare Finder');
  });

  it('should suggest rarity hunter for 3+ rare specimens', () => {
    const specimens = [
      { mineral_name: 'Diamond', rarity: 'rare' },
      { mineral_name: 'Ruby', rarity: 'rare' },
      { mineral_name: 'Emerald', rarity: 'rare' },
    ];
    const suggestions = suggestBadgeTargets(specimens);
    expect(suggestions).toContain('Rare Finder');
    expect(suggestions).toContain('Rarity Hunter');
  });

  it('should filter out completed badges', () => {
    const specimens = [
      { mineral_name: 'Quartz' },
      { mineral_name: 'Quartz' },
    ];
    const completed = ['Quartz Pair'];
    expect(suggestBadgeTargets(specimens, completed)).toEqual([]);
  });

  it('should handle complex mixed collection', () => {
    const specimens = [
      { mineral_name: 'Quartz', verified: true, rarity: 'common' },
      { mineral_name: 'Quartz', verified: true, rarity: 'common' },
      { mineral_name: 'Gold', verified: true, rarity: 'rare' },
      { mineral_name: 'Silver', verified: true, rarity: 'uncommon' },
      { mineral_name: 'Copper', verified: true, rarity: 'common' },
    ];
    // 5 total -> Collection Pioneer
    // 5 verified -> Verified Expert
    // 2 Quartz -> Quartz Pair
    // 1 rare -> Rare Finder
    const suggestions = suggestBadgeTargets(specimens);
    expect(suggestions).toEqual([
      'Quartz Pair',
      'Collection Pioneer',
      'Verified Expert',
      'Rare Finder'
    ]);
  });
});
