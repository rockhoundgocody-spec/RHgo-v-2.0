import { describe, it, expect, vi } from 'vitest';
import React from 'react';

let idCount = 0;
let mockTipsOpen = false;

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [mockTipsOpen, vi.fn()],
    useMemo: (factory) => factory(),
    useId: () => `:r${idCount++}:`,
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
    expect(lightingTipsBtn.props.className).toContain('focus-visible:ring-2');
    expect(lightingTipsBtn.props.className).toContain('focus-visible:ring-amber-400/50');

    expect(scaleRefBtn.props['aria-pressed']).toBe(true);
    expect(scaleRefBtn.props.className).toContain('focus-visible:ring-2');
    expect(scaleRefBtn.props.className).toContain('focus-visible:ring-hud-cyan/50');
  });

  it('renders modal sheet with correct dialog ARIA attributes when tipsOpen is true', () => {
    mockTipsOpen = true;

    const element = ScanModeBar({
      mode: 'rock',
      onModeChange: vi.fn(),
      scaleOn: false,
      onScaleToggle: vi.fn(),
    });

    const [, utilityToggles, tipSheetContainer] = element.props.children;
    const [lightingTipsBtn] = utilityToggles.props.children;
    const dialogId = lightingTipsBtn.props['aria-controls'];

    // AnimatePresence children when tipsOpen is true
    const backdrop = tipSheetContainer.props.children;
    expect(backdrop).toBeDefined();

    const modalPanel = backdrop.props.children;
    expect(modalPanel.props.id).toBe(dialogId);
    expect(modalPanel.props.role).toBe('dialog');
    expect(modalPanel.props['aria-modal']).toBe('true');
    expect(modalPanel.props['aria-labelledby']).toBeDefined();

    const titleId = modalPanel.props['aria-labelledby'];
    const headerContainer = modalPanel.props.children[0];
    const headerTitleGroup = headerContainer.props.children[0];
    const h3Title = headerTitleGroup.props.children[1];

    expect(h3Title.props.id).toBe(titleId);

    mockTipsOpen = false;
  });
});
