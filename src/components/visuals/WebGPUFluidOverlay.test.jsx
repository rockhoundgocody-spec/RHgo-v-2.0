import { describe, it, expect, vi } from 'vitest';

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useRef: (initial) => ({ current: initial }),
    useState: (initial) => [initial, vi.fn()],
    useEffect: vi.fn(),
  };
});

import WebGPUFluidOverlay from './WebGPUFluidOverlay.jsx';

describe('WebGPUFluidOverlay component', () => {
  it('renders container div with pointer-events-none styling when ready is false', () => {
    const element = WebGPUFluidOverlay({
      resolution: 128,
      intensity: 1.0,
      getAmplitude: () => 0.5,
      getSpectrum: () => ({ bass: 0.1, mid: 0.2, treble: 0.3 }),
    });

    expect(element).toBeDefined();
    expect(element.type).toBe('div');
    expect(element.props.className).toContain('pointer-events-none');
    expect(element.props.style).toEqual({ opacity: 0, mixBlendMode: 'screen' });
  });
});
