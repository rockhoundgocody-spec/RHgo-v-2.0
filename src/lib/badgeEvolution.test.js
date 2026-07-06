import { describe, it, expect } from 'vitest';
import { getBadgeColorByRarity } from './badgeEvolution';

describe('getBadgeColorByRarity', () => {
  const commonColors = {
    primary: '#9CA3AF',
    accent: '#D1D5DB',
    glow: 'rgba(156, 163, 175, 0.3)',
  };

  it('should return common colors for "common" rarity', () => {
    expect(getBadgeColorByRarity('common')).toEqual(commonColors);
  });

  it('should return uncommon colors for "uncommon" rarity', () => {
    expect(getBadgeColorByRarity('uncommon')).toEqual({
      primary: '#3B82F6',
      accent: '#60A5FA',
      glow: 'rgba(59, 130, 246, 0.3)',
    });
  });

  it('should return rare colors for "rare" rarity', () => {
    expect(getBadgeColorByRarity('rare')).toEqual({
      primary: '#8B5CF6',
      accent: '#A78BFA',
      glow: 'rgba(139, 92, 246, 0.3)',
    });
  });

  it('should return epic colors for "epic" rarity', () => {
    expect(getBadgeColorByRarity('epic')).toEqual({
      primary: '#EC4899',
      accent: '#F472B6',
      glow: 'rgba(236, 72, 153, 0.3)',
    });
  });

  it('should return legendary colors for "legendary" rarity', () => {
    expect(getBadgeColorByRarity('legendary')).toEqual({
      primary: '#FBBF24',
      accent: '#FCD34D',
      glow: 'rgba(251, 191, 36, 0.4)',
    });
  });

  it('should fallback to common colors for unknown rarity', () => {
    expect(getBadgeColorByRarity('mythic')).toEqual(commonColors);
  });

  it('should fallback to common colors for undefined rarity', () => {
    expect(getBadgeColorByRarity(undefined)).toEqual(commonColors);
  });

  it('should fallback to common colors for null rarity', () => {
    expect(getBadgeColorByRarity(null)).toEqual(commonColors);
  });
});
