import { describe, it, expect } from 'vitest';
import {
  assessTranscript,
  cleanTranscript,
  repairFieldTerms,
  stripFillers,
  rejectionLine,
  CONFIDENCE_THRESHOLD,
} from './cloverVoice';

describe('Clover voice accuracy', () => {
  it('accepts a confident transcript', () => {
    const v = assessTranscript('where did I find the red beryl', 0.92);
    expect(v.ok).toBe(true);
    expect(v.text).toBe('where did I find the red beryl');
    expect(v.soft).toBe(false);
    expect(v.reason).toBe('ok');
  });

  it('drops an utterance the engine was unsure about', () => {
    const v = assessTranscript('find the amethyst', CONFIDENCE_THRESHOLD - 0.2);
    expect(v.ok).toBe(false);
    expect(v.reason).toBe('low_confidence');
  });

  it('accepts a transcript when the engine reports no score at all', () => {
    // Chrome reports 0 when it has no opinion — missing data, not a bad score.
    const v = assessTranscript('open my collection', 0);
    expect(v.ok).toBe(true);
    expect(v.confidence).toBeNull();
    expect(v.reported).toBe(false);
  });

  it('marks a middling score soft so Clover asks instead of guessing', () => {
    const v = assessTranscript('what is this one', 0.6);
    expect(v.ok).toBe(true);
    expect(v.soft).toBe(true);
  });

  it('rejects silence and stray noise', () => {
    expect(assessTranscript('   ', 0.9).ok).toBe(false);
    expect(assessTranscript('um', 0.9).reason).toBe('empty');
  });

  it('strips filler from the edges only', () => {
    expect(stripFillers('uh, so where is the blm land')).toBe('where is the blm land');
    expect(stripFillers('go to the uh, gate')).toBe('go to the uh, gate');
  });

  it('repairs the field words the engines mis-hear', () => {
    expect(repairFieldTerms('is this red barrel')).toBe('is this red beryl');
    expect(repairFieldTerms('pull up the am a thist')).toBe('pull up the amethyst');
    expect(repairFieldTerms('clo ver what is a gee ode')).toBe('Clover what is a geode');
  });

  it('capitalises the brand terms it repairs', () => {
    expect(cleanTranscript('hey clover what is b l m land')).toBe('hey Clover what is BLM land');
  });

  it('never rewrites an ordinary sentence', () => {
    expect(repairFieldTerms('close the gate')).toBe('close the gate');
    expect(repairFieldTerms('cloverleaf')).toBe('cloverleaf');
    expect(repairFieldTerms('the clovers are out')).toBe('the clovers are out');
  });

  it('has a retry line for every rejection worth speaking aloud', () => {
    expect(rejectionLine('low_confidence')).toBeTruthy();
    expect(rejectionLine('too_short')).toBeTruthy();
    expect(rejectionLine('empty')).toBeNull();
  });
});