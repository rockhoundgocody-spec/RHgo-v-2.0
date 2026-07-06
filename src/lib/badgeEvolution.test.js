import { describe, it, expect, vi } from 'vitest';
import {
  calculateBadgeStage,
  getBadgeColorByRarity,
  renderBadgeWithEvolution,
  calculateBadgeMilestones,
  suggestBadgeTargets,
  unlockBadgeWithProgress
} from './badgeEvolution';

describe('badgeEvolution', () => {
  describe('calculateBadgeStage', () => {
    const badge = { id: 'test-badge' };

    it('should return "discovered" if no badge is provided', () => {
      expect(calculateBadgeStage(null, [])).toBe('discovered');
    });

    it('should return "discovered" if count is 0', () => {
      const specimens = [
        { badges_unlocked: ['other-badge'] },
        { badges_unlocked: [] }
      ];
      expect(calculateBadgeStage(badge, specimens)).toBe('discovered');
    });

    it('should return "collected" if count is 1 or 2', () => {
      const specimens1 = [{ badges_unlocked: ['test-badge'] }];
      const specimens2 = [
        { badges_unlocked: ['test-badge'] },
        { badges_unlocked: ['test-badge'] },
        { badges_unlocked: ['other-badge'] }
      ];
      expect(calculateBadgeStage(badge, specimens1)).toBe('collected');
      expect(calculateBadgeStage(badge, specimens2)).toBe('collected');
    });

    it('should return "verified" if count is 3 or 4', () => {
      const specimens3 = Array(3).fill(null).map(() => ({ badges_unlocked: ['test-badge'] }));
      const specimens4 = Array(4).fill(null).map(() => ({ badges_unlocked: ['test-badge'] }));
      expect(calculateBadgeStage(badge, specimens3)).toBe('verified');
      expect(calculateBadgeStage(badge, specimens4)).toBe('verified');
    });

    it('should return "exemplary" if count is between 5 and 9', () => {
      const specimens5 = Array(5).fill(null).map(() => ({ badges_unlocked: ['test-badge'] }));
      const specimens9 = Array(9).fill(null).map(() => ({ badges_unlocked: ['test-badge'] }));
      expect(calculateBadgeStage(badge, specimens5)).toBe('exemplary');
      expect(calculateBadgeStage(badge, specimens9)).toBe('exemplary');
    });

    it('should return "legendary" if count is 10 or more', () => {
      const specimens10 = Array(10).fill(null).map(() => ({ badges_unlocked: ['test-badge'] }));
      const specimens11 = Array(11).fill(null).map(() => ({ badges_unlocked: ['test-badge'] }));
      expect(calculateBadgeStage(badge, specimens10)).toBe('legendary');
      expect(calculateBadgeStage(badge, specimens11)).toBe('legendary');
    });
  });

  describe('getBadgeColorByRarity', () => {
    it('should return common colors for unknown rarity', () => {
      const result = getBadgeColorByRarity('unknown');
      expect(result.primary).toBe('#9CA3AF');
    });

    it('should return colors for all defined rarities', () => {
      expect(getBadgeColorByRarity('common').primary).toBe('#9CA3AF');
      expect(getBadgeColorByRarity('uncommon').primary).toBe('#3B82F6');
      expect(getBadgeColorByRarity('rare').primary).toBe('#8B5CF6');
      expect(getBadgeColorByRarity('epic').primary).toBe('#EC4899');
      expect(getBadgeColorByRarity('legendary').primary).toBe('#FBBF24');
    });
  });

  describe('renderBadgeWithEvolution', () => {
    const badge = { id: 'test-badge', rarity: 'rare' };

    it('should return correct style and label for a stage', () => {
      const result = renderBadgeWithEvolution(badge, 'exemplary');
      expect(result.label).toBe('Exemplary');
      expect(result.style.opacity).toBe(1);
      expect(result.style.transform).toBe('scale(1.1)');
      expect(result.animation).toBe('none');
    });

    it('should use "collected" as default stage', () => {
      const result = renderBadgeWithEvolution(badge);
      expect(result.label).toBe('Collected');
      expect(result.style.opacity).toBe(0.85);
    });

    it('should include liquid-glow animation for legendary stage', () => {
      const result = renderBadgeWithEvolution(badge, 'legendary');
      expect(result.animation).toBe('liquid-glow 2s ease-in-out infinite');
    });
  });

  describe('calculateBadgeMilestones', () => {
    const badgeId = 'test-badge';

    it('should calculate current count and next milestone', () => {
      const specimens = [{ badges_unlocked: ['test-badge'] }, { badges_unlocked: ['test-badge'] }];
      const result = calculateBadgeMilestones(badgeId, specimens);

      expect(result.count).toBe(2);
      expect(result.nextMilestone.count).toBe(3);
      expect(result.nextMilestone.stage).toBe('verified');
    });

    it('should return undefined nextMilestone if all milestones reached', () => {
      const specimens = Array(10).fill(null).map(() => ({ badges_unlocked: ['test-badge'] }));
      const result = calculateBadgeMilestones(badgeId, specimens);
      expect(result.nextMilestone).toBeUndefined();
    });
  });

  describe('suggestBadgeTargets', () => {
    it('should suggest "Mineral Pair" and "Collector" based on counts', () => {
      const specimens2 = [
        { mineral_name: 'Quartz' },
        { mineral_name: 'Quartz' }
      ];
      expect(suggestBadgeTargets(specimens2)).toContain('Quartz Pair');

      const specimens5 = Array(5).fill(null).map(() => ({ mineral_name: 'Quartz' }));
      expect(suggestBadgeTargets(specimens5)).toContain('Quartz Collector');
    });

    it('should suggest collection level badges', () => {
      const specimens5 = Array(5).fill(null).map(() => ({ mineral_name: 'Quartz' }));
      expect(suggestBadgeTargets(specimens5)).toContain('Collection Pioneer');

      const specimens25 = Array(25).fill(null).map(() => ({ mineral_name: 'Quartz' }));
      expect(suggestBadgeTargets(specimens25)).toContain('Serious Collector');
    });

    it('should suggest verification and rarity badges', () => {
      const specimens = [
        { verified: true }, { verified: true }, { verified: true }, { verified: true }, { verified: true },
        { rarity: 'rare' }, { rarity: 'rare' }, { rarity: 'rare' }
      ];
      const suggestions = suggestBadgeTargets(specimens);
      expect(suggestions).toContain('Verified Expert');
      expect(suggestions).toContain('Rare Finder');
      expect(suggestions).toContain('Rarity Hunter');
    });

    it('should filter out completed badges', () => {
      const specimens = Array(5).fill(null).map(() => ({ mineral_name: 'Quartz' }));
      const result = suggestBadgeTargets(specimens, ['Collection Pioneer', 'Quartz Collector']);
      expect(result).not.toContain('Collection Pioneer');
      expect(result).not.toContain('Quartz Collector');
    });
  });

  describe('unlockBadgeWithProgress', () => {
    it('should create a badge and link it to a specimen', async () => {
      const mockBadge = { id: 'badge-123', code: 'test_badge' };
      const mockSpecimen = { id: 'spec-456', badges_unlocked: ['old-badge'] };

      const base44 = {
        entities: {
          Badge: {
            create: vi.fn().mockResolvedValue(mockBadge)
          },
          Specimen: {
            get: vi.fn().mockResolvedValue(mockSpecimen),
            update: vi.fn().mockResolvedValue({})
          }
        }
      };

      const result = await unlockBadgeWithProgress(base44, 'user@test.com', 'test_badge', 'spec-456');

      expect(base44.entities.Badge.create).toHaveBeenCalledWith(expect.objectContaining({
        code: 'test_badge',
        owner_email: 'user@test.com'
      }));
      expect(base44.entities.Specimen.get).toHaveBeenCalledWith('spec-456');
      expect(base44.entities.Specimen.update).toHaveBeenCalledWith('spec-456', {
        badges_unlocked: ['old-badge', 'badge-123']
      });
      expect(result).toEqual(mockBadge);
    });
  });
});
