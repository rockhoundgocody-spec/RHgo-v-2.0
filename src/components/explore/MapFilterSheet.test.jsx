import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
}));

vi.mock('@/lib/useFocusTrap', () => ({
  useFocusTrap: vi.fn(),
}));

import MapFilterSheet from './MapFilterSheet.jsx';
import { useFocusTrap } from '@/lib/useFocusTrap';

describe('MapFilterSheet', () => {
  it('renders nothing when closed', () => {
    const html = renderToStaticMarkup(
      React.createElement(MapFilterSheet, {
        open: false,
        onClose: vi.fn(),
        activeLayer: 'all',
        onLayerChange: vi.fn(),
        selectedMinerals: new Set(),
        onToggleMineral: vi.fn(),
        onClearMinerals: vi.fn(),
        minerals: ['Quartz', 'Amethyst'],
      })
    );
    expect(html).toBe('');
  });

  it('renders modal dialog with accessible ARIA attributes and radio groups when open', () => {
    const html = renderToStaticMarkup(
      React.createElement(MapFilterSheet, {
        open: true,
        onClose: vi.fn(),
        activeLayer: 'all',
        onLayerChange: vi.fn(),
        selectedMinerals: new Set(['Quartz']),
        onToggleMineral: vi.fn(),
        onClearMinerals: vi.fn(),
        minerals: ['Quartz', 'Amethyst'],
      })
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="Access filters"');
    expect(html).toContain('aria-label="Spot filters"');
    expect(html).toContain('role="radio"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('aria-label="Search rocks"');
  });

  it('invokes useFocusTrap hook with container ref and onClose callback when open', () => {
    const onCloseMock = vi.fn();
    renderToStaticMarkup(
      React.createElement(MapFilterSheet, {
        open: true,
        onClose: onCloseMock,
        activeLayer: 'all',
        onLayerChange: vi.fn(),
        selectedMinerals: new Set(),
        onToggleMineral: vi.fn(),
        onClearMinerals: vi.fn(),
        minerals: [],
      })
    );

    expect(useFocusTrap).toHaveBeenLastCalledWith(
      expect.objectContaining({ current: null }),
      expect.objectContaining({
        active: true,
        onClose: onCloseMock,
      })
    );
  });
});
