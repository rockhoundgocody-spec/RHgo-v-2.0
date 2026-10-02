import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
    useMemo: (factory) => factory(),
    useRef: (initial) => ({ current: initial }),
    useEffect: vi.fn(),
  };
});

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }) => React.createElement('button', props, children),
    span: ({ children, ...props }) => React.createElement('span', props, children),
    div: ({ children, ...props }) => React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
  useReducedMotion: () => false,
}));

vi.mock('@/lib/offlineQueue', () => ({
  queueWrite: vi.fn(),
  getQueueLength: vi.fn(() => 0),
}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      me: vi.fn().mockResolvedValue({ email: 'test@example.com' }),
    },
  },
}));

vi.mock('@/lib/privateLocation', () => ({
  buildPrivatePinRecord: vi.fn(),
}));

import QuickPinButton from './QuickPinButton.jsx';

describe('QuickPinButton', () => {
  it('renders idle button with default aria-label and aria-pressed false', () => {
    const element = QuickPinButton({ userLocation: { lat: 37.7749, lng: -122.4194 } });

    expect(element).toBeDefined();
    const button = element.props.children[0];
    expect(button.props['aria-label']).toBe('Save this location to my private rock log');
    expect(button.props['aria-pressed']).toBe(false);
    expect(button.props['aria-busy']).toBe(false);
  });

  it('renders queue badge with role status and aria-label when queue count > 0', async () => {
    const { getQueueLength } = await import('@/lib/offlineQueue');
    vi.mocked(getQueueLength).mockReturnValueOnce(3);

    const element = QuickPinButton({ userLocation: { lat: 37.7749, lng: -122.4194 } });
    const badge = element.props.children[1];

    expect(badge).toBeTruthy();
    expect(badge.props.role).toBe('status');
    expect(badge.props['aria-label']).toBe('3 pending pins');
  });
});
