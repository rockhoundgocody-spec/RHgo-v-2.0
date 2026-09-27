import { describe, it, expect } from 'vitest';
import {
  budgetLeft, cleanCandidates, coverCrop, describeTop, frameDiff, hintFor, lightingOf, lumaOf,
  settleReason, shouldClassify, toGray,
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

  it('treats a back-off timestamp in the future as a cooldown', () => {
    expect(shouldClassify({ ...base, lastCallAt: base.now + 5000 }).reason).toBe('cooldown');
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
    expect(hintFor({ reason: 'daily', candidates: [{ name: 'Quartz' }] })).toMatch(/used up/i);
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

  it('describes the best guess for screen readers', () => {
    expect(describeTop([{ name: 'Lake Superior agate', confidence: 0.816, rarity: 'uncommon' }]))
      .toBe('Looks like Lake Superior agate, 82 percent sure, uncommon.');
    expect(describeTop([{ name: 'Basalt', confidence: 0.5, rarity: 'common' }])).toBe('Looks like Basalt, 50 percent sure.');
    expect(describeTop([])).toBe('');
  });
});

describe('settleReason', () => {
  const idle = { shown: null, pending: null, count: 0 };

  it('needs a reason to repeat before showing it', () => {
    const once = settleReason(idle, 'moving');
    expect(once.shown).toBeNull();
    const twice = settleReason(once, 'moving');
    expect(twice.shown).toBe('moving');
  });

  it('ignores a one-tick blip and maps quiet reasons to no hint', () => {
    const shown = { shown: 'moving', pending: 'moving', count: 0 };
    const blip = settleReason(shown, 'cooldown');
    expect(blip.shown).toBe('moving');
    expect(settleReason(blip, 'moving').shown).toBe('moving');
    const cleared = settleReason(settleReason(shown, 'ready'), 'busy');
    expect(cleared.shown).toBeNull();
  });
});

describe('coverCrop', () => {
  it('maps the on-screen aiming square into a portrait frame', () => {
    // 1080x1920 portrait stream shown full-bleed on a 390x844 phone view.
    expect(coverCrop({ videoW: 1080, videoH: 1920, viewW: 390, viewH: 844 }))
      .toEqual({ sx: 265, sy: 685, size: 550 });
  });

  it('handles a landscape stream in a portrait view', () => {
    const crop = coverCrop({ videoW: 1920, videoH: 1080, viewW: 390, viewH: 844 });
    expect(crop.size).toBe(309);
    expect(crop.sx).toBe(806);
    expect(crop.sy).toBe(386);
  });

  it('never exceeds the frame and falls back to a centred square', () => {
    const wide = coverCrop({ videoW: 640, videoH: 480, viewW: 2000, viewH: 300 });
    expect(wide.size).toBeLessThanOrEqual(480);
    expect(coverCrop({ videoW: 1920, videoH: 1080, viewW: 0, viewH: 0 })).toEqual({ sx: 420, sy: 0, size: 1080 });
    expect(coverCrop({ videoW: 0, videoH: 0, viewW: 390, viewH: 844 })).toEqual({ sx: 0, sy: 0, size: 0 });
  });
});
