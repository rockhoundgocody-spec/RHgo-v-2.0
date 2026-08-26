import { describe, expect, it } from 'vitest';
import { normalizeSignal } from './ScanReticle.jsx';

describe('normalizeSignal', () => {
  it('clamps live scan progress to the drawable range', () => {
    expect(normalizeSignal(-0.5)).toBe(0);
    expect(normalizeSignal(0.45)).toBe(0.45);
    expect(normalizeSignal(2)).toBe(1);
  });

  it('uses a safe empty progress value for malformed input', () => {
    expect(normalizeSignal(undefined)).toBe(0);
    expect(normalizeSignal('not-a-number')).toBe(0);
  });
});
