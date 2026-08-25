import { describe, it, expect, vi, beforeAll } from 'vitest';

let MineralFilterPanel;

beforeAll(async () => {
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = {
      self: {},
      top: {},
    };
  }
  MineralFilterPanel = (await import('./MineralFilterPanel')).default;
});

describe('MineralFilterPanel', () => {
  it('returns null when minerals array is empty', () => {
    const tree = MineralFilterPanel({ minerals: [], selected: new Set() });
    expect(tree).toBeNull();
  });

  it('renders "All" chip as aria-pressed=true when selected is empty', () => {
    const handleClearAll = vi.fn();
    const handleToggle = vi.fn();
    const tree = MineralFilterPanel({
      minerals: ['Quartz', 'Agate'],
      selected: new Set(),
      onToggle: handleToggle,
      onClearAll: handleClearAll,
    });

    expect(tree).not.toBeNull();
    const [allChip, quartzChip, agateChip] = tree.props.children.flat();

    expect(allChip.props['aria-pressed']).toBe(true);
    expect(allChip.props.className).toContain('focus-visible:ring-2');

    expect(quartzChip.props['aria-pressed']).toBe(false);
    expect(quartzChip.props.className).toContain('focus-visible:ring-2');

    expect(agateChip.props['aria-pressed']).toBe(false);

    // Test click on mineral chip
    quartzChip.props.onClick();
    expect(handleToggle).toHaveBeenCalledWith('Quartz');
  });

  it('renders specific mineral as aria-pressed=true when present in selected Set', () => {
    const handleClearAll = vi.fn();
    const handleToggle = vi.fn();
    const tree = MineralFilterPanel({
      minerals: ['Quartz', 'Agate'],
      selected: new Set(['Quartz']),
      onToggle: handleToggle,
      onClearAll: handleClearAll,
    });

    const [allChip, quartzChip, agateChip] = tree.props.children.flat();

    expect(allChip.props['aria-pressed']).toBe(false);
    expect(quartzChip.props['aria-pressed']).toBe(true);
    expect(agateChip.props['aria-pressed']).toBe(false);

    // Test click on All chip
    allChip.props.onClick();
    expect(handleClearAll).toHaveBeenCalled();
  });
});
