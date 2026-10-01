import { describe, it, expect, vi } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
    useEffect: vi.fn(),
  };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

import WeatherPanel from './WeatherPanel.jsx';

describe('WeatherPanel', () => {
  it('renders root container with region role and descriptive aria-label', () => {
    const element = WeatherPanel({ userLocation: null, hudMode: false, onClose: vi.fn() });
    expect(element).toBeDefined();
    expect(element.props.role).toBe('region');
    expect(element.props['aria-label']).toBe('Beach conditions weather panel');
  });

  it('renders close button with type="button" and descriptive aria-label', () => {
    const onClose = vi.fn();
    const element = WeatherPanel({ userLocation: null, hudMode: false, onClose });

    // Find header close button
    const container = element.props.children;
    const header = container.props.children[0];
    const closeBtn = header.props.children[1];

    expect(closeBtn.props.type).toBe('button');
    expect(closeBtn.props['aria-label']).toBe('Close beach conditions panel');
  });

  it('renders prompt when userLocation is missing', () => {
    const element = WeatherPanel({ userLocation: null, hudMode: false, onClose: vi.fn() });
    const container = element.props.children;
    const prompt = container.props.children[2];

    expect(prompt.props.children).toBe('Enable location to see beach conditions.');
  });
});
