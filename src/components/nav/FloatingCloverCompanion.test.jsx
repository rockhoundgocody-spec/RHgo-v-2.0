import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
    useMemo: (factory) => factory(),
  };
});

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/explore' }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
    button: ({ children, ...props }) => React.createElement('button', props, children),
  },
  AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
}));

vi.mock('@/components/visuals/AmethystOrb.jsx', () => ({
  default: () => React.createElement('div', { 'data-testid': 'amethyst-orb' }),
}));

vi.mock('@/components/hub/CloverVoicePanel.jsx', () => ({
  default: () => React.createElement('div', { id: 'clover-voice-panel' }),
}));

vi.mock('@/components/hub/useCloverConversation.js', () => ({
  default: () => ({
    phase: 'idle',
    messages: [],
    interim: '',
    voiceSupported: true,
    unlock: vi.fn(),
    start: vi.fn(),
    end: vi.fn(),
    nudge: vi.fn(),
    send: vi.fn(),
    getAmplitude: () => 0,
    getSpectrum: () => [],
  }),
}));

vi.mock('@/lib/orbAudio', () => ({
  playOrbChime: vi.fn(),
  triggerOrbHaptic: vi.fn(),
}));

import FloatingCloverCompanion from './FloatingCloverCompanion';

describe('FloatingCloverCompanion', () => {
  it('renders orb button with accessibility attributes when collapsed', () => {
    const element = FloatingCloverCompanion();
    expect(element).toBeDefined();

    const children = element.props.children;
    const button = children[1];

    expect(button.props['aria-expanded']).toBe(false);
    expect(button.props['aria-controls']).toBe('clover-voice-panel');
    expect(button.props['aria-label']).toBe('Talk to Clover');
    expect(button.props.className).toContain('focus-visible:ring-2');
    expect(button.props.className).toContain('focus-visible:ring-amethyst-glow');
  });
});
