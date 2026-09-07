import { describe, expect, it } from 'vitest';
import {
  FEATURES,
  buildUnlockHint,
  crawlScore,
  featureForPath,
  featuresRevealedAt,
  isPathOpen,
  nextUnlock,
  requiredTitleFor,
  unlockedFeatures,
  xpNeededForLevel,
} from './featureProgression.js';

describe('feature ladder', () => {
  it('keeps Scan, Explore, and GeoDex open at Pebble Scout', () => {
    expect(isPathOpen('/scan', 1)).toBe(true);
    expect(isPathOpen('/explore', 1)).toBe(true);
    expect(isPathOpen('/collection', 1)).toBe(true);
    expect(isPathOpen('/chronolith', 1)).toBe(false);
    expect(isPathOpen('/market', 1)).toBe(false);
  });

  it('opens Chronolith at Crystal Apprentice and Market only at Mythic', () => {
    expect(isPathOpen('/chronolith', 2)).toBe(true);
    expect(isPathOpen('/quests', 2)).toBe(false);
    expect(isPathOpen('/market', 5)).toBe(false);
    expect(isPathOpen('/market', 6)).toBe(true);
  });

  it('does not trap profile, settings, or unknown routes behind a rank', () => {
    expect(isPathOpen('/profile', 1)).toBe(true);
    expect(isPathOpen('/settings', 1)).toBe(true);
    expect(isPathOpen('/specimen/abc', 1)).toBe(true);
  });

  it('matches nested paths to the parent wing', () => {
    expect(featureForPath('/expedition/north-shore')?.id).toBe('expeditions');
    expect(featureForPath('/live/stream-1')).toBeNull();
  });

  it('names the title that unlocks a wing', () => {
    expect(requiredTitleFor(featureForPath('/chronolith'))).toBe('Crystal Apprentice');
    expect(requiredTitleFor(featureForPath('/market'))).toBe('Mythic Earth Wizard');
  });

  it('points Pebble Scouts at Chronolith as the next brag', () => {
    const next = nextUnlock(1);
    expect(next?.id).toBe('chronolith');
    expect(featuresRevealedAt(2).map((f) => f.id)).toEqual(['chronolith', 'compare']);
  });
});

describe('unlock hint and crawl score', () => {
  it('counts XP still needed to wake a locked wing', () => {
    expect(xpNeededForLevel(2, 0)).toBe(1200);
    expect(xpNeededForLevel(2, 900)).toBe(300);
    const hint = buildUnlockHint({ xp: 900, feature: featureForPath('/chronolith') });
    expect(hint.title).toBe('Crystal Apprentice');
    expect(hint.xpNeeded).toBe(300);
  });

  it('treats crawling as a collection score over non-core wings', () => {
    const score = crawlScore(['chronolith', 'scan', 'quests']);
    expect(score.crawled).toBe(2);
    expect(score.total).toBe(FEATURES.filter((f) => !f.core).length);
  });

  it('lists only core wings as unlocked on day one', () => {
    expect(unlockedFeatures(1).every((f) => f.core || f.minLevel === 1)).toBe(true);
    expect(unlockedFeatures(1).some((f) => f.id === 'market')).toBe(false);
  });
});
