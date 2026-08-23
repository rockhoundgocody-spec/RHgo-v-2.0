import { describe, it, expect, beforeAll } from 'vitest';
import React from 'react';

let ChartStyle;

beforeAll(async () => {
  globalThis.window = {
    self: {},
    top: {},
    location: {
      search: '',
      href: 'http://localhost:3000',
      pathname: '/',
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };
  globalThis.window.self = globalThis.window;
  globalThis.window.top = globalThis.window;

  const mod = await import('./chart.jsx');
  ChartStyle = mod.ChartStyle;
});

describe('ChartStyle', () => {
  it('returns null when config has no theme or color entries', () => {
    const result = ChartStyle({ id: 'chart-test', config: {} });
    expect(result).toBeNull();
  });

  it('renders css variables for standard theme config', () => {
    const config = {
      desktop: { label: 'Desktop', color: '#2563eb' },
      mobile: { label: 'Mobile', theme: { light: '#60a5fa', dark: '#1d4ed8' } },
    };
    const element = ChartStyle({ id: 'chart-test', config });
    expect(element).toBeDefined();
    expect(element.type).toBe('style');

    const cssText = element.props.children || element.props.dangerouslySetInnerHTML?.__html;
    expect(cssText).toContain('[data-chart=chart-test]');
    expect(cssText).toContain('--color-desktop: #2563eb;');
    expect(cssText).toContain('--color-mobile: #60a5fa;');
    expect(cssText).toContain('--color-mobile: #1d4ed8;');
  });

  it('sanitizes malicious id to prevent CSS / HTML injection', () => {
    const config = {
      desktop: { label: 'Desktop', color: '#2563eb' },
    };
    const maliciousId = 'chart-test"; } </style><script>alert(1)</script>';
    const element = ChartStyle({ id: maliciousId, config });

    const cssText = element.props.children || element.props.dangerouslySetInnerHTML?.__html;
    expect(cssText).not.toContain('</style>');
    expect(cssText).not.toContain('<script>');
    expect(cssText).not.toContain('alert(1)');
  });

  it('sanitizes malicious key names to prevent CSS injection', () => {
    const config = {
      'desktop; } body { background: red; }': { label: 'Desktop', color: '#2563eb' },
    };
    const element = ChartStyle({ id: 'chart-test', config });

    const cssText = element.props.children || element.props.dangerouslySetInnerHTML?.__html;
    expect(cssText).not.toContain('body { background: red; }');
  });

  it('sanitizes malicious color values to prevent CSS / HTML injection', () => {
    const config = {
      desktop: { label: 'Desktop', color: 'red; } </style><script>alert("xss")</script>' },
    };
    const element = ChartStyle({ id: 'chart-test', config });

    const cssText = element.props.children || element.props.dangerouslySetInnerHTML?.__html;
    expect(cssText).not.toContain('</style>');
    expect(cssText).not.toContain('<script>');
    expect(cssText).not.toContain('alert("xss")');
  });
});
