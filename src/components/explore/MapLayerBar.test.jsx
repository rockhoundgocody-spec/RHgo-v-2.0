import { beforeAll, describe, expect, it, vi } from 'vitest';

globalThis.window = {
  self: 1,
  top: 1,
  location: { href: 'http://localhost' },
};

let MapLayerBar;

describe('MapLayerBar', () => {
  beforeAll(async () => {
    MapLayerBar = (await import('./MapLayerBar')).default;
  });

  it('exposes filter state and visible keyboard focus styles', () => {
    const onChange = vi.fn();
    const element = MapLayerBar({ activeLayer: 'rare', onChange });
    const buttons = element.props.children;

    expect(element.props.role).toBe('group');
    expect(element.props['aria-label']).toBe('Map result filters');
    expect(buttons).toHaveLength(5);

    const rareButton = buttons[1];
    expect(rareButton.props.type).toBe('button');
    expect(rareButton.props['aria-pressed']).toBe(true);
    expect(rareButton.props.className).toContain('focus-visible:ring-sky-400/70');

    expect(buttons[0].props['aria-pressed']).toBe(false);
    expect(buttons[0].props.className).toContain('focus-visible:ring-white/70');

    rareButton.props.onClick();
    expect(onChange).toHaveBeenCalledWith('rare');
  });
});
