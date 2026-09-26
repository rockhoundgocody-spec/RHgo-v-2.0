import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

describe('FieldModeSection', () => {
  it('contains role="switch" button with aria-checked and focus styling', () => {
    const filePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'FieldModeSection.jsx');
    const source = fs.readFileSync(filePath, 'utf-8');
    expect(source).toContain('role="switch"');
    expect(source).toContain('aria-checked={Boolean(offlineMode)}');
    expect(source).toContain('focus-visible:ring-emerald-400/70');
  });

  it('renders a role="switch" button with aria-checked reflecting offlineMode prop', () => {
    const falseElement = FieldModeSection({ offlineMode: false, onToggle: () => {} });
    const switchBtnFalse = findElementByRole(falseElement, 'switch');
    expect(switchBtnFalse).not.toBeNull();
    expect(switchBtnFalse.props['aria-checked']).toBe(false);

    const trueElement = FieldModeSection({ offlineMode: true, onToggle: () => {} });
    const switchBtnTrue = findElementByRole(trueElement, 'switch');
    expect(switchBtnTrue).not.toBeNull();
    expect(switchBtnTrue.props['aria-checked']).toBe(true);
  });

  it('triggers onToggle callback when switch button onClick is called', () => {
    const handleToggle = vi.fn();
    const element = FieldModeSection({ offlineMode: false, onToggle: handleToggle });
    const switchBtn = findElementByRole(element, 'switch');
    switchBtn.props.onClick({ stopPropagation: () => {} });
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });
});
