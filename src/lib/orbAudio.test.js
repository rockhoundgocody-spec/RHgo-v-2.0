import { describe, it, expect, vi } from 'vitest';
import { getLuckyMineralOfTheDay, playOrbChime, triggerOrbHaptic } from './orbAudio';

describe('orbAudio', () => {
  it('returns a deterministic lucky mineral of the day with proper fields', () => {
    const mineral = getLuckyMineralOfTheDay();
    expect(mineral).toBeDefined();
    expect(mineral.name).toBeTruthy();
    expect(mineral.buff).toBeTruthy();
    expect(mineral.tip).toBeTruthy();
    expect(mineral.dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('runs playOrbChime safely without error in node / jsdom environment', () => {
    expect(() => playOrbChime(528)).not.toThrow();
  });

  it('runs triggerOrbHaptic safely without error', () => {
    expect(() => triggerOrbHaptic('tap')).not.toThrow();
    expect(() => triggerOrbHaptic('blessing')).not.toThrow();
  });
});
