import { describe, it, expect, vi } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  let idCounter = 0;
  return {
    ...actual,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
    useMemo: (factory) => factory(),
    useId: () => `:r${++idCounter}:`,
  };
});

vi.mock('@/lib/orbAudio', () => ({
  triggerOrbHaptic: vi.fn(),
}));

import MohsScratchLab from './MohsScratchLab';

describe('MohsScratchLab', () => {
  it('renders scratch test tool group with accessible buttons and focus rings', () => {
    const element = MohsScratchLab({ specimenHardness: 7.0, mineralName: 'Quartz' });

    expect(element).toBeDefined();
    expect(element.type).toBe('div');

    const [header, toolGroup] = element.props.children;

    // Verify tool group wrapper accessibility
    expect(toolGroup.props.role).toBe('group');
    expect(toolGroup.props['aria-label']).toBe('Scratch test tools');

    // Verify tool buttons
    const buttons = toolGroup.props.children;
    expect(buttons).toHaveLength(6);

    const defaultSelectedButton = buttons[2]; // Steel Knife default
    expect(defaultSelectedButton.type).toBe('button');
    expect(defaultSelectedButton.props.type).toBe('button');
    expect(defaultSelectedButton.props['aria-pressed']).toBe(true);
    expect(defaultSelectedButton.props['aria-label']).toContain('Steel Knife');
    expect(defaultSelectedButton.props.className).toContain('focus-visible:ring-2');

    const fingernailButton = buttons[0];
    expect(fingernailButton.props['aria-pressed']).toBe(false);
    expect(fingernailButton.props['aria-label']).toContain('Fingernail');
  });

  it('renders feedback region with role="status" and aria-live="polite"', () => {
    const element = MohsScratchLab({ specimenHardness: 7.0, mineralName: 'Quartz' });

    const [, , feedbackRegion] = element.props.children;

    expect(feedbackRegion.props.role).toBe('status');
    expect(feedbackRegion.props['aria-live']).toBe('polite');
  });

  it('sets aria-hidden="true" on decorative icons and emojis', () => {
    const element = MohsScratchLab({ specimenHardness: 7.0, mineralName: 'Quartz' });

    const [header, toolGroup] = element.props.children;

    // Header hammer icon
    const headerTitle = header.props.children[0];
    const hammerIcon = headerTitle.props.children[0];
    expect(String(hammerIcon.props['aria-hidden'])).toBe('true');

    // Tool emoji
    const toolButton = toolGroup.props.children[0];
    const emojiSpan = toolButton.props.children[0].props.children[0];
    expect(String(emojiSpan.props['aria-hidden'])).toBe('true');
  });
});
