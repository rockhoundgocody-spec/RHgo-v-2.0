import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

let mockPathname = '/explore';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
    useMemo: (factory) => factory(),
  };
});

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: mockPathname }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
    button: ({ children, ...props }) => React.createElement('button', props, children),
  },
  AnimatePresence: ({ children }) => children,
}));

vi.mock('@/components/visuals/AmethystOrb.jsx', () => ({
  default: () => React.createElement('div', { 'data-testid': 'amethyst-orb' }),
}));

vi.mock('@/components/hub/CloverVoicePanel.jsx', () => ({
  default: ({ onClose }) => React.createElement('div', { 'data-testid': 'voice-panel' },
    React.createElement('button', { 'aria-label': 'Close panel', onClick: onClose })
  ),
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

import FloatingCloverCompanion from './FloatingCloverCompanion';

describe('FloatingCloverCompanion', () => {
  beforeEach(() => {
    mockPathname = '/explore';
  });

  it('renders null when on the hub page (/) or admin routes', () => {
    mockPathname = '/';
    expect(FloatingCloverCompanion()).toBeNull();

    mockPathname = '/admin';
    expect(FloatingCloverCompanion()).toBeNull();
  });

  it('renders accessible orb button on non-hub routes', () => {
    mockPathname = '/explore';
    const element = FloatingCloverCompanion();
    expect(element).toBeDefined();

    // Find motion.button in returned jsx tree
    const containerChildren = element.props.children;
    const button = Array.isArray(containerChildren) ? containerChildren[1] : containerChildren;

    expect(button.props['type']).toBe('button');
    expect(button.props['aria-expanded']).toBe(false);
    expect(button.props['aria-controls']).toBe('clover-voice-panel');
    expect(button.props['aria-label']).toBe('Talk to Clover');
    expect(button.props.className).toContain('focus-visible:ring-amethyst-glow');
    expect(button.props.className).toContain('focus-visible:outline-none');
  });
});
