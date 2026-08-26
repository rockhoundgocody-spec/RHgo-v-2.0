import { describe, it, expect, vi, beforeEach } from 'vitest';

if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    location: { origin: 'http://localhost' },
  };
}

if (!globalThis.navigator) {
  globalThis.navigator = {};
}

let stateStore = {};
let effectStore = [];

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => {
      const id = stateStore.currentId++;
      if (!(id in stateStore.values)) {
        stateStore.values[id] = typeof initial === 'function' ? initial() : initial;
      }
      const setState = (val) => {
        stateStore.values[id] = typeof val === 'function' ? val(stateStore.values[id]) : val;
      };
      return [stateStore.values[id], setState];
    },
    useEffect: (fn) => {
      effectStore.push(fn);
    },
  };
});

import PermissionsPrompt from './PermissionsPrompt.jsx';

describe('PermissionsPrompt', () => {
  beforeEach(() => {
    stateStore = { currentId: 0, values: {} };
    effectStore = [];
  });

  function renderComponent(props = {}) {
    stateStore.currentId = 0;
    const tree = PermissionsPrompt(props);
    const effectsToRun = [...effectStore];
    effectStore = [];
    effectsToRun.forEach((effect) => effect());
    return tree;
  }

  it('renders dismiss button with aria-label and focus-visible classes when onDismiss is provided', () => {
    const onDismissMock = vi.fn();
    const tree = renderComponent({ onDismiss: onDismissMock });

    expect(tree).not.toBeNull();
    const headerDiv = tree.props.children[0];
    const dismissButton = headerDiv.props.children[1];

    expect(dismissButton).toBeDefined();
    expect(dismissButton.props['aria-label']).toBe('Dismiss feature prompt');
    expect(dismissButton.props.className).toContain('focus-visible:ring-2');
    expect(dismissButton.props.className).toContain('focus-visible:ring-amethyst-glow/50');
  });

  it('renders permission action buttons with focus-visible classes', () => {
    const tree = renderComponent({});

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
