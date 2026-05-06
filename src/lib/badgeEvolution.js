/**
 * Badge Evolution System
 * Badges grow, evolve, and glow based on achievement progression
 * Creates emotional investment through "living" artifacts
 */

export const BADGE_EVOLUTION_STAGES = {
  discovered: {
    opacity: 0.6,
    scale: 0.9,
    glow: 'drop-shadow(0 0 8px currentColor)',
    label: 'First Found',
  },
  collected: {
    opacity: 0.85,
    scale: 1,
    glow: 'drop-shadow(0 0 12px currentColor)',
    label: 'Collected',
  },
  verified: {
    opacity: 1,
    scale: 1.05,
    glow: 'drop-shadow(0 0 16px currentColor)',
    label: 'Verified',
  },
  exemplary: {
    opacity: 1,
    scale: 1.1,
    glow: 'drop-shadow(0 0 24px currentColor) drop-shadow(0 0 8px rgba(255,255,255,0.3))',
    label: 'Exemplary',
  },
  legendary: {
    opacity: 1,
    scale: 1.15,
    glow: 'drop-shadow(0 0 32px currentColor) drop-shadow(0 0 16px rgba(255,255,255,0.5))',
    label: 'Legendary',
  },
};

/**
 * Calculate badge evolution stage based on achievement metrics
 */
export function calculateBadgeStage(badge, specimens) {
  if (!badge) return 'discovered';

  // Count badges of this type collected
  const count = specimens.filter((s) => s.badges_unlocked?.includes(badge.id)).length;

  if (count >= 10) return 'legendary';
  if (count >= 5) return 'exemplary';
  if (count >= 3) return 'verified';
  if (count >= 1) return 'collected';

  return 'discovered';
}

/**
 * Get rarity-based color palette for badges
 */
export function getBadgeColorByRarity(rarity) {
  const rarityColors = {
    common: {
      primary: '#9CA3AF',
      accent: '#D1D5DB',
      glow: 'rgba(156, 163, 175, 0.3)',
    },
    uncommon: {
      primary: '#3B82F6',
      accent: '#60A5FA',
      glow: 'rgba(59, 130, 246, 0.3)',
    },
    rare: {
      primary: '#8B5CF6',
      accent: '#A78BFA',
      glow: 'rgba(139, 92, 246, 0.3)',
    },
    epic: {
      primary: '#EC4899',
      accent: '#F472B6',
      glow: 'rgba(236, 72, 153, 0.3)',
    },
    legendary: {
      primary: '#FBBF24',
      accent: '#FCD34D',
      glow: 'rgba(251, 191, 36, 0.4)',
    },
  };

  return rarityColors[rarity] || rarityColors.common;
}

/**
 * Render badge with evolution state + effects
 */
export function renderBadgeWithEvolution(badge, stage = 'collected') {
  const stageConfig = BADGE_EVOLUTION_STAGES[stage];
  const colorPalette = getBadgeColorByRarity(badge.rarity);

  return {
    style: {
      opacity: stageConfig.opacity,
      transform: `scale(${stageConfig.scale})`,
      filter: stageConfig.glow,
      color: colorPalette.primary,
      boxShadow: `0 0 20px ${colorPalette.glow}`,
    },
    label: stageConfig.label,
    animation: stage === 'legendary' ? 'liquid-glow 2s ease-in-out infinite' : 'none',
  };
}

/**
 * Generate achievement milestone data
 */
export function calculateBadgeMilestones(badgeId, specimens) {
  const related = specimens.filter((s) => s.badges_unlocked?.includes(badgeId));

  return {
    count: related.length,
    milestones: [
      { count: 1, stage: 'collected', label: '1 Collect' },
      { count: 3, stage: 'verified', label: '3 Verified' },
      { count: 5, stage: 'exemplary', label: '5 Exemplary' },
      { count: 10, stage: 'legendary', label: '10 Legendary' },
    ],
    nextMilestone: [
      { count: 1, stage: 'collected', label: '1 Collect' },
      { count: 3, stage: 'verified', label: '3 Verified' },
      { count: 5, stage: 'exemplary', label: '5 Exemplary' },
      { count: 10, stage: 'legendary', label: '10 Legendary' },
    ].find((m) => m.count > related.length),
  };
}

/**
 * Suggest next badge targets based on collection
 */
export function suggestBadgeTargets(specimens, completedBadges = []) {
  const mineralsCollected = {};

  specimens.forEach((s) => {
    mineralsCollected[s.mineral_name] = (mineralsCollected[s.mineral_name] || 0) + 1;
  });

  const suggestions = [];

  // Mineral mastery badges
  Object.entries(mineralsCollected).forEach(([mineral, count]) => {
    if (count === 2) suggestions.push(`${mineral} Pair`);
    if (count === 5) suggestions.push(`${mineral} Collector`);
  });

  // Collection badges
  if (specimens.length >= 5) suggestions.push('Collection Pioneer');
  if (specimens.length >= 25) suggestions.push('Serious Collector');

  // Verification badges
  const verified = specimens.filter((s) => s.verified).length;
  if (verified >= 5) suggestions.push('Verified Expert');

  // Rarity badges
  const rareCount = specimens.filter((s) => s.rarity === 'rare').length;
  if (rareCount >= 1) suggestions.push('Rare Finder');
  if (rareCount >= 3) suggestions.push('Rarity Hunter');

  return suggestions.filter((b) => !completedBadges.includes(b));
}

/**
 * Unlock badge with progression tracking
 */
export async function unlockBadgeWithProgress(
  base44,
  userId,
  badgeCode,
  specimenId
) {
  // Create badge record
  const badge = await base44.entities.Badge.create({
    code: badgeCode,
    title: badgeCode.replace(/_/g, ' '),
    rarity: 'uncommon',
    owner_email: userId,
    earned_at: new Date().toISOString(),
  });

  // Link to specimen
  const specimen = await base44.entities.Specimen.get(specimenId);
  const badgeIds = [...(specimen.badges_unlocked || []), badge.id];
  await base44.entities.Specimen.update(specimenId, {
    badges_unlocked: badgeIds,
  });

  return badge;
}