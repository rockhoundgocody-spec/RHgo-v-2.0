import { describe, it, expect, vi } from 'vitest';

vi.hoisted(() => {
  const mockStorage = () => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = value ? value.toString() : ''; },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; },
    };
  };

  globalThis.window = {
    self: {},
    top: {},
    location: { search: '', href: 'http://localhost', pathname: '/', hash: '' },
    history: { replaceState: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    localStorage: mockStorage(),
    sessionStorage: mockStorage(),
  };
  globalThis.document = { title: 'Test' };
});

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useId: () => ':test-switch-id:',
  };
});

import FieldModeSection from './FieldModeSection.jsx';

function findElementByRole(element, role) {
  if (!element || typeof element !== 'object') return null;
  if (element.props && element.props.role === role) return element;
  if (element.props && element.props.children) {
    const children = Array.isArray(element.props.children)
      ? element.props.children
      : [element.props.children];
    for (const child of children) {
      const found = findElementByRole(child, role);
      if (found) return found;
    }
  }
  return null;
}

function findLabelFor(element, htmlForId) {
  if (!element || typeof element !== 'object') return null;
  if (element.props && element.props.htmlFor === htmlForId) return element;
  if (element.props && element.props.children) {
    const children = Array.isArray(element.props.children)
      ? element.props.children
      : [element.props.children];
    for (const child of children) {
      const found = findLabelFor(child, htmlForId);
      if (found) return found;
    }
  }
  return null;
}

describe('FieldModeSection', () => {
  it('renders switch button linked to label via htmlFor and useId', () => {
    const tree = FieldModeSection({ offlineMode: false, onToggle: () => {} });
    const switchBtn = findElementByRole(tree, 'switch');
    expect(switchBtn).not.toBeNull();
    expect(switchBtn.props.id).toBe(':test-switch-id:');
    expect(switchBtn.props['aria-checked']).toBe(false);

    const label = findLabelFor(tree, ':test-switch-id:');
    expect(label).not.toBeNull();
    expect(label.props.children).toBe('Offline mode enabled');
  });

  it('reflects offlineMode=true on aria-checked attribute', () => {
    const tree = FieldModeSection({ offlineMode: true, onToggle: () => {} });
    const switchBtn = findElementByRole(tree, 'switch');
    expect(switchBtn.props['aria-checked']).toBe(true);
  });

  it('invokes onToggle handler when switch button is clicked', () => {
    const handleToggle = vi.fn();
    const tree = FieldModeSection({ offlineMode: false, onToggle: handleToggle });
    const switchBtn = findElementByRole(tree, 'switch');
    switchBtn.props.onClick();
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });
});
