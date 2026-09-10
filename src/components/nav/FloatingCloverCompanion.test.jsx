import { describe, it, expect, vi } from 'vitest';

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
    useId: () => ':r0:',
  };
});

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/explore' }),
}));

vi.mock('@/components/visuals/AmethystOrb.jsx', () => ({
  default: () => null,
}));

vi.mock('@/components/hub/CloverVoicePanel.jsx', () => ({
  default: () => null,
}));

vi.mock('@/components/hub/useCloverConversation.js', () => ({
  default: () => ({
    phase: 'idle',
    messages: [],
    interim: '',
    start: vi.fn(),
    stop: vi.fn(),
    send: vi.fn(),
    getAmplitude: () => 0,
    getSpectrum: () => [],
  }),
}));

vi.mock('@/lib/orbAudio', () => ({
  playOrbChime: vi.fn(),
  triggerOrbHaptic: vi.fn(),
}));

import FloatingCloverCompanion from './FloatingCloverCompanion.jsx';

describe('FloatingCloverCompanion', () => {
  it('renders persistent orb button with accessible ARIA properties', () => {
    const element = FloatingCloverCompanion();
    expect(element).not.toBeNull();

    // Check persistent button props
    const button = element.props.children[1];
    expect(button.props.type).toBe('button');
    expect(button.props['aria-expanded']).toBe(false);
    expect(button.props['aria-controls']).toBeUndefined();
    expect(button.props['aria-label']).toBe('Talk to Clover');
    expect(button.props.className).toContain('focus-visible:ring-2');
    expect(button.props.className).toContain('focus-visible:ring-amethyst-glow/80');
  });
});
