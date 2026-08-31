import { describe, it, expect, vi } from 'vitest';
import React from 'react';

let mockTipsOpen = null;

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  let idCounter = 0;
  return {
    ...actual,
    useState: (initial) => [mockTipsOpen !== null ? mockTipsOpen : initial, vi.fn()],
    useMemo: (factory) => factory(),
    useId: () => `:r${++idCounter}:`,
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
    expect(lightingTipsBtn.props['aria-controls']).toBeDefined();
    expect(typeof lightingTipsBtn.props['aria-controls']).toBe('string');
    expect(lightingTipsBtn.props.className).toContain('focus-visible:ring-2');
    expect(lightingTipsBtn.props.className).toContain('focus-visible:ring-amber-400/50');

    expect(scaleRefBtn.props['aria-pressed']).toBe(true);
    expect(scaleRefBtn.props.className).toContain('focus-visible:ring-2');
    expect(scaleRefBtn.props.className).toContain('focus-visible:ring-hud-cyan/50');
  });

  it('renders modal dialog overlay with role="dialog", aria-modal="true" and matching ids when tips panel is open', () => {
    mockTipsOpen = true;

    const element = ScanModeBar({
      mode: 'rock',
      onModeChange: vi.fn(),
      scaleOn: false,
      onScaleToggle: vi.fn(),
    });

    const [, utilityToggles, tipsSheetWrapper] = element.props.children;
    const [lightingTipsBtn] = utilityToggles.props.children;
    const dialogId = lightingTipsBtn.props['aria-controls'];

    const backdropOverlay = tipsSheetWrapper.props.children;
    const dialogSheet = backdropOverlay.props.children;

    expect(dialogSheet.props.id).toBe(dialogId);
    expect(dialogSheet.props.role).toBe('dialog');
    expect(dialogSheet.props['aria-modal']).toBe('true');
    expect(dialogSheet.props['aria-labelledby']).toBeDefined();

    const [headerContainer] = dialogSheet.props.children;
    const [titleContainer] = headerContainer.props.children;
    const [, h3Title] = titleContainer.props.children;

    expect(h3Title.props.id).toBe(dialogSheet.props['aria-labelledby']);

    mockTipsOpen = null;
  });
});
