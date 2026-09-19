import { describe, it, expect, vi } from 'vitest';

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useRef: (initial) => ({ current: initial }),
    useEffect: (cb) => {
      const cleanup = cb();
      if (typeof cleanup === 'function') cleanup();
    },
  };
});

import BlackOpalShader from './BlackOpalShader';

describe('BlackOpalShader', () => {
  it('renders container element with absolute inset-0 className', () => {
    const result = BlackOpalShader({ intensity: 1.0, speed: 0.25, hueShift: 0 });
    expect(result).toBeDefined();
    expect(result.type).toBe('div');
    expect(result.props.className).toBe('absolute inset-0');
  });

  it('handles default props safely', () => {
    const result = BlackOpalShader({});
    expect(result.type).toBe('div');
    expect(result.props.className).toBe('absolute inset-0');
  });

  it('accepts audio amplitude and spectrum getters without throwing', () => {
    const mockGetAmp = vi.fn(() => 0.8);
    const mockGetSpec = vi.fn(() => ({ bass: 0.5, mid: 0.3, treble: 0.2 }));

    const result = BlackOpalShader({
      intensity: 1.5,
      speed: 0.5,
      hueShift: 0.1,
      getAmplitude: mockGetAmp,
      getSpectrum: mockGetSpec,
    });

    expect(result.type).toBe('div');
  });
});
