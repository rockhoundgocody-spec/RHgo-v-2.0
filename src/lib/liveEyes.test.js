import { describe, it, expect } from 'vitest';
import {
  budgetLeft, cleanCandidates, frameDiff, hintFor, lightingOf, lumaOf, shouldClassify, toGray,
  MIN_GAP_MS, STEADY_MS, BUDGET,
} from './liveEyes';

const rgba = (v, n = 4) => new Uint8ClampedArray(Array.from({ length: n * 4 }, (_, i) => (i % 4 === 3 ? 255 : v)));

describe('frame math', () => {
  it('measures brightness and difference', () => {
    expect(Math.round(lumaOf(rgba(100)))).toBe(100);
    const a = toGray(rgba(100));
    const b = toGray(rgba(110));
    expect(frameDiff(a, b)).toBe(10);
    expect(frameDiff(a, a)).toBe(0);
    expect(frameDiff(a, null)).toBe(255);
  });

  it('classifies lighting', () => {
    expect(lightingOf(20)).toBe('dark');
    expect(lightingOf(120)).toBe('ok');
    expect(lightingOf(250)).toBe('glare');
  });
});

describe('shouldClassify', () => {
  const base = {
    now: 100000, steadySince: 100000 - STEADY_MS - 1, busy: false, lastCallAt: null,
    lighting: 'ok', sceneDiff: 255, callTimes: [], hidden: false,
  };

  it('fires when steady, lit, idle and new', () => {
    expect(shouldClassify(base)).toEqual({ go: true, reason: 'ready' });
  });

  it('waits while moving, busy, dark or hidden', () => {
    expect(shouldClassify({ ...base, steadySince: base.now - 100 }).reason).toBe('moving');
    expect(shouldClassify({ ...base, steadySince: null }).reason).toBe('moving');
    expect(shouldClassify({ ...base, busy: true }).reason).toBe('busy');
    expect(shouldClassify({ ...base, lighting: 'dark' }).reason).toBe('dark');
    expect(shouldClassify({ ...base, hidden: true }).reason).toBe('hidden');
  });

  it('respects the cooldown and skips an unchanged scene', () => {
    expect(shouldClassify({ ...base, lastCallAt: base.now - 1000 }).reason).toBe('cooldown');
    expect(shouldClassify({ ...base, lastCallAt: base.now - MIN_GAP_MS - 1, sceneDiff: 3 }).reason).toBe('same-scene');
    expect(shouldClassify({ ...base, lastCallAt: base.now - MIN_GAP_MS - 1, sceneDiff: 40 }).go).toBe(true);
  });

  it('stops when the session budget is spent', () => {
    const callTimes = Array.from({ length: BUDGET.calls }, (_, i) => base.now - i * 1000);
    expect(budgetLeft(callTimes, base.now)).toBe(0);
    expect(shouldClassify({ ...base, callTimes }).reason).toBe('budget');
    expect(budgetLeft(callTimes, base.now + BUDGET.windowMs + 1)).toBe(BUDGET.calls);
  });
});

describe('hints and candidates', () => {
  it('coaches the hunter', () => {
    expect(hintFor({ reason: 'dark' })).toMatch(/light/i);
    expect(hintFor({ reason: 'ready', quality: 'too_far' })).toMatch(/closer/i);
    expect(hintFor({ reason: 'moving', candidates: [] })).toMatch(/steady/i);
    expect(hintFor({ reason: 'ready', candidates: [{ name: 'Quartz' }] })).toBeNull();
  });

  it('keeps confident, well-formed guesses, best first', () => {
    const out = cleanCandidates([
      { name: 'Quartz', confidence: 0.4, rarity: 'common' },
      { name: 'Fluorite', confidence: 0.82, rarity: 'uncommon' },
      { name: '', confidence: 0.9 },
      { name: 'Noise', confidence: 0.1 },
      { name: 'Calcite', confidence: 7, rarity: 'weird' },
    ]);
    expect(out.map((c) => c.name)).toEqual(['Calcite', 'Fluorite', 'Quartz']);
    expect(out[0]).toEqual({ name: 'Calcite', confidence: 1, rarity: 'common' });
    expect(cleanCandidates(null)).toEqual([]);
  });
});
