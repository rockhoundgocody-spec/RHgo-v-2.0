import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

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

describe('CloverVoiceSection', () => {
  it('contains aria-describedby linking range sliders to hint text in component source code', () => {
    const filePath = path.resolve(__dirname, 'CloverVoiceSection.jsx');
    const source = fs.readFileSync(filePath, 'utf-8');
    expect(source).toContain('aria-describedby={hintId}');
    expect(source).toContain('id={hintId}');
  });
});
