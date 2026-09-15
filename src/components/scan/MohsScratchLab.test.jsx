import { describe, it, expect, vi } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => {
      // Return a basic state mock for functional test invocation
      return [initial, vi.fn()];
    },
  };
});

vi.mock('@/lib/orbAudio', () => ({
  triggerOrbHaptic: vi.fn(),
}));

import MohsScratchLab from './MohsScratchLab';

describe('MohsScratchLab', () => {
  it('renders tool selector buttons with accessibility attributes and focus ring styles', () => {
    const tree = MohsScratchLab({ specimenHardness: 7.0, mineralName: 'Quartz' });

    expect(tree).toBeDefined();
    expect(tree.type).toBe('div');

    const [, toolContainer] = tree.props.children;

    expect(toolContainer.props.className).toContain('grid');
    const toolButtons = toolContainer.props.children;
    expect(toolButtons).toHaveLength(6);

    // Default selected tool is Steel Knife (3rd tool, index 2)
    const knifeButton = toolButtons[2];
    expect(knifeButton.props.type).toBe('button');
    expect(knifeButton.props['aria-pressed']).toBe(true);
    expect(knifeButton.props['aria-label']).toBe('Steel Knife (Hardness 5.5 Mohs)');
    expect(knifeButton.props.className).toContain('focus-visible:ring-2');
    expect(knifeButton.props.className).toContain('focus-visible:ring-amethyst-glow/50');

    // Check non-selected tool (Fingernail, index 0)
    const fingernailButton = toolButtons[0];
    expect(fingernailButton.props.type).toBe('button');
    expect(fingernailButton.props['aria-pressed']).toBe(false);
    expect(fingernailButton.props['aria-label']).toBe('Fingernail (Hardness 2.5 Mohs)');

    // Check decorative icon has aria-hidden
    const [iconWrapper] = fingernailButton.props.children[0].props.children;
    expect(iconWrapper.props['aria-hidden']).toBe('true');
  });

  it('renders the result container with role="status" and aria-live="polite"', () => {
    const tree = MohsScratchLab({ specimenHardness: 7.0 });

    const [, , resultContainer] = tree.props.children;

    expect(resultContainer.props.role).toBe('status');
    expect(resultContainer.props['aria-live']).toBe('polite');
  });
});
