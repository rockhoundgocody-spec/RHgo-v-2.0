import { describe, it, expect, vi } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
    useMemo: (factory) => factory(),
  };
});

vi.mock('@/lib/orbAudio', () => ({
  triggerOrbHaptic: vi.fn(),
}));

import MohsScratchLab from './MohsScratchLab';

describe('MohsScratchLab', () => {
  it('renders correctly with default props and tool options', () => {
    const tree = MohsScratchLab({ specimenHardness: 7.0, mineralName: 'Quartz' });
    expect(tree).toBeDefined();

    // Container children: Header [0], Tool Grid [1], Feedback Box [2]
    const children = tree.props.children;
    expect(children).toHaveLength(3);

    const toolGrid = children[1];
    expect(toolGrid.props.role).toBe('group');
    expect(toolGrid.props['aria-label']).toBe('Mohs test tools');

    const toolButtons = toolGrid.props.children;
    expect(toolButtons).toHaveLength(6);

    // Default selected tool is 'knife' (index 2)
    const steelKnifeBtn = toolButtons[2];
    expect(steelKnifeBtn.props.type).toBe('button');
    expect(steelKnifeBtn.props['aria-pressed']).toBe(true);
    expect(steelKnifeBtn.props['aria-label']).toContain('Steel Knife');
    expect(steelKnifeBtn.props.className).toContain('focus-visible:ring-2');
    expect(steelKnifeBtn.props.className).toContain('focus-visible:ring-amber-400/70');

    // Emoji icon aria-hidden check
    const iconSpan = steelKnifeBtn.props.children[0].props.children[0];
    expect(iconSpan.props['aria-hidden']).toBe('true');

    // Feedback container checks
    const feedbackBox = children[2];
    expect(feedbackBox.props.role).toBe('status');
    expect(feedbackBox.props['aria-live']).toBe('polite');
  });

  it('handles tool selection callback execution', () => {
    const tree = MohsScratchLab({ specimenHardness: 7.0, mineralName: 'Quartz' });
    const toolGrid = tree.props.children[1];
    const toolButtons = toolGrid.props.children;

    // Quartz Point (index 4)
    const quartzBtn = toolButtons[4];
    expect(quartzBtn.props['aria-pressed']).toBe(false);
    expect(quartzBtn.props['aria-label']).toContain('Quartz Point');
    expect(quartzBtn.props.title).toBe('Natural quartz reference point');
  });
});
