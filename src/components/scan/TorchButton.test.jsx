import { describe, it, expect, vi } from 'vitest';
import TorchButton from './TorchButton.jsx';

describe('TorchButton', () => {
  it('returns null when supported is false', () => {
    const element = TorchButton({ supported: false, on: false, onToggle: vi.fn() });
    expect(element).toBeNull();
  });

  it('renders button with correct accessibility attributes when torch is off', () => {
    const onToggle = vi.fn();
    const element = TorchButton({ supported: true, on: false, onToggle });

    expect(element).toBeDefined();
    expect(element.type).toBe('button');
    expect(element.props['aria-label']).toBe('Turn flashlight on');
    expect(element.props.title).toBe('Turn flashlight on');
    expect(element.props['aria-pressed']).toBe(false);
    expect(element.props.className).toContain('focus-visible:ring-2');
    expect(element.props.className).toContain('focus-visible:ring-yellow-500/50');

    // Simulate click
    element.props.onClick();
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders button with correct accessibility attributes when torch is on', () => {
    const onToggle = vi.fn();
    const element = TorchButton({ supported: true, on: true, onToggle });

    expect(element).toBeDefined();
    expect(element.type).toBe('button');
    expect(element.props['aria-label']).toBe('Turn flashlight off');
    expect(element.props.title).toBe('Turn flashlight off');
    expect(element.props['aria-pressed']).toBe(true);
  });
});
