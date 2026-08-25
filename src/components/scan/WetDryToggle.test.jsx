import { describe, it, expect, vi } from 'vitest';
import WetDryToggle from './WetDryToggle';

describe('WetDryToggle', () => {
  it('returns elements with correct aria-pressed props when value is wet', () => {
    const handleChange = vi.fn();
    const tree = WetDryToggle({ value: 'wet', onChange: handleChange });

    expect(tree).toBeDefined();
    expect(tree.type).toBe('div');

    const [wetButton, dryButton] = tree.props.children;

    expect(wetButton.type).toBe('button');
    expect(wetButton.props['aria-pressed']).toBe(true);
    expect(wetButton.props.type).toBe('button');

    expect(dryButton.type).toBe('button');
    expect(dryButton.props['aria-pressed']).toBe(false);
    expect(dryButton.props.type).toBe('button');

    // Test click callback
    wetButton.props.onClick();
    expect(handleChange).toHaveBeenCalledWith('wet');
  });

  it('returns elements with correct aria-pressed props when value is dry', () => {
    const handleChange = vi.fn();
    const tree = WetDryToggle({ value: 'dry', onChange: handleChange });

    const [wetButton, dryButton] = tree.props.children;

    expect(wetButton.props['aria-pressed']).toBe(false);
    expect(dryButton.props['aria-pressed']).toBe(true);

    // Test click callback
    dryButton.props.onClick();
    expect(handleChange).toHaveBeenCalledWith('dry');
  });
});
