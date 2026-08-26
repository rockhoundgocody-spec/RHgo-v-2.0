import { describe, it, expect, vi } from 'vitest';

if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    location: { origin: 'http://localhost' },
  };
}

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
    useEffect: vi.fn(),
  };
});

import PermissionsPrompt from './PermissionsPrompt';

describe('PermissionsPrompt', () => {
  it('renders dismiss button with aria-label and focus-visible classes when onDismiss is provided', () => {
    const onDismissMock = vi.fn();
    const tree = PermissionsPrompt({ onDismiss: onDismissMock });

    expect(tree).not.toBeNull();
    const headerDiv = tree.props.children[0];
    const dismissButton = headerDiv.props.children[1];

    expect(dismissButton).toBeDefined();
    expect(dismissButton.props['aria-label']).toBe('Dismiss feature prompt');
    expect(dismissButton.props.className).toContain('focus-visible:ring-2');
    expect(dismissButton.props.className).toContain('focus-visible:ring-amethyst-glow/50');
  });

  it('renders permission action buttons with focus-visible classes', () => {
    const tree = PermissionsPrompt({});

    expect(tree).not.toBeNull();
    const itemsContainer = tree.props.children[1];
    const items = itemsContainer.props.children;

    expect(items.length).toBeGreaterThan(0);
    const firstItem = items[0];
    const actionButton = firstItem.props.children[2];

    expect(actionButton).toBeDefined();
    expect(actionButton.props.className).toContain('focus-visible:ring-2');
    expect(actionButton.props.className).toContain('focus-visible:ring-amethyst-glow/50');
  });
});
