import { describe, it, expect } from 'vitest';
import {
  BANDS,
  VOICE_MATCH_THRESHOLD,
  bandVector,
  buildPrint,
  cosine,
  createNoiseGate,
  matchScore,
  meanVector,
  speechFrameRatio,
} from './voicePrint';

/** A synthetic voice: a loud bump in the spectrum at `center`. */
function voiceBins(center, { size = 128, width = 7, amp = 220 } = {}) {
  const bins = new Array(size);
  for (let i = 0; i < size; i++) {
    bins[i] = Math.round(8 + amp * Math.exp(-((i - center) ** 2) / (2 * width ** 2)));
  }
  return bins;
}

// Two voices as the ear would actually hand them over: band shapes, not spectra.
const speakerA = [22, 26, 24, 20, 28, 23].map((center) => bandVector(voiceBins(center)));
const speakerB = [66, 70, 68, 64, 72, 69].map((center) => bandVector(voiceBins(center)));

describe('voicePrint — shape vectors', () => {
  it('turns a spectrum into a unit-length band shape', () => {
    const v = bandVector(voiceBins(30));
    expect(v).toHaveLength(BANDS);
    const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    expect(mag).toBeCloseTo(1, 2);
  });

  it('gives silence no shape at all', () => {
    expect(bandVector(new Array(128).fill(0)).every((v) => v === 0)).toBe(true);
    expect(bandVector(null)).toHaveLength(BANDS);
  });

  it('reads a quiet voice and a loud one as the same voice', () => {
    const quiet = bandVector(voiceBins(40, { amp: 60 }));
    const loud = bandVector(voiceBins(40, { amp: 250 }));
    expect(cosine(quiet, loud)).toBeGreaterThan(0.95);
  });
});

describe('voicePrint — speaker matching', () => {
  it('needs enough speech before it will save a print', () => {
    expect(buildPrint(speakerA)).toBeNull();
    expect(meanVector(speakerA, 3)).not.toBeNull();
  });

  it('saves a print from a real sample', () => {
    const frames = Array.from({ length: 20 }, () => bandVector(voiceBins(24)));
    const print = buildPrint(frames);
    expect(print).not.toBeNull();
    expect(print.bands).toHaveLength(BANDS);
    expect(print.frameCount).toBe(20);
  });

  it('scores the enrolled speaker high and a different voice low', () => {
    const frames = Array.from({ length: 20 }, () => bandVector(voiceBins(24)));
    const print = buildPrint(frames);
    const mine = matchScore(print, speakerA);
    const other = matchScore(print, speakerB);
    expect(mine).toBeGreaterThanOrEqual(VOICE_MATCH_THRESHOLD);
    expect(other).toBeLessThan(VOICE_MATCH_THRESHOLD);
  });

  it('scores zero when there is nothing to compare', () => {
    expect(matchScore(null, speakerA)).toBe(0);
    expect(matchScore({ bands: bandVector(voiceBins(24)) }, [])).toBe(0);
  });
});

describe('voicePrint — noise gate', () => {
  it('stays shut in a quiet room and opens for a spoken phrase', () => {
    const gate = createNoiseGate();
    for (let i = 0; i < 40; i++) expect(gate.push(0.02)).toBe(false);
    expect(gate.push(0.5)).toBe(true);
    expect(gate.floor).toBeLessThan(0.1);
  });

  it('raises the bar on steady background noise', () => {
    const gate = createNoiseGate();
    for (let i = 0; i < 900; i++) gate.push(0.2);
    expect(gate.isSpeech(0.2)).toBe(false);
    expect(gate.isSpeech(0.8)).toBe(true);
  });

  it('follows the room back down when it quietens', () => {
    const gate = createNoiseGate();
    for (let i = 0; i < 400; i++) gate.push(0.3);
    const noisy = gate.floor;
    for (let i = 0; i < 200; i++) gate.push(0.01);
    expect(gate.floor).toBeLessThan(noisy);
  });

  it('measures how much of a window was speech', () => {
    expect(speechFrameRatio([], 0.02)).toBe(0);
    expect(speechFrameRatio([0.01, 0.01, 0.02], 0.02)).toBe(0);
    expect(speechFrameRatio([0.4, 0.5, 0.01], 0.02)).toBeCloseTo(2 / 3, 3);
  });
});