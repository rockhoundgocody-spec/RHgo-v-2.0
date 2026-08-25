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

// Mock framer-motion to simplify rendering motion elements
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }) => children,
}));

import ScanModeBar from './ScanModeBar';

describe('ScanModeBar', () => {
  it('renders mode selector buttons with correct aria-pressed attributes', () => {
    const onModeChange = vi.fn();
    const onScaleToggle = vi.fn();

    const element = ScanModeBar({
      mode: 'crystal',
      onModeChange,
      scaleOn: false,
      onScaleToggle,
    });

    expect(element).toBeDefined();
    expect(element.type).toBe('div');

    // Children of outer container: mode pills container (index 0), utility toggles (index 1), tip sheet (index 2)
    const [pillsContainer] = element.props.children;

    const modeButtons = pillsContainer.props.children;
    expect(modeButtons).toHaveLength(4);

    // Mode buttons: 'rock', 'crystal', 'fossil', 'matrix'
    const rockBtn = modeButtons[0];
    const crystalBtn = modeButtons[1];

    expect(rockBtn.props['aria-pressed']).toBe(false);
    expect(crystalBtn.props['aria-pressed']).toBe(true);

    expect(crystalBtn.props.className).toContain('focus-visible:ring-2');
    expect(crystalBtn.props.className).toContain('focus-visible:ring-amethyst-glow/50');
  });

  it('renders utility toggles with correct accessibility attributes', () => {
    const onModeChange = vi.fn();
    const onScaleToggle = vi.fn();

    const element = ScanModeBar({
      mode: 'rock',
      onModeChange,
      scaleOn: true,
      onScaleToggle,
    });

    const [, utilityToggles] = element.props.children;
    const [lightingTipsBtn, scaleRefBtn] = utilityToggles.props.children;

    expect(lightingTipsBtn.props['aria-expanded']).toBe(false);
    expect(lightingTipsBtn.props.className).toContain('focus-visible:ring-2');
    expect(lightingTipsBtn.props.className).toContain('focus-visible:ring-amber-400/50');

    expect(scaleRefBtn.props['aria-pressed']).toBe(true);
    expect(scaleRefBtn.props.className).toContain('focus-visible:ring-2');
    expect(scaleRefBtn.props.className).toContain('focus-visible:ring-hud-cyan/50');
  });
});
