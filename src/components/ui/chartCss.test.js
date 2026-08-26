import { describe, expect, it } from 'vitest';
import { buildChartCss, toSafeCssIdentifier } from './chartCss';

const THEMES = { light: '', dark: '.dark' };

describe('chart CSS generation', () => {
  it('builds light and dark variables for valid colors', () => {
    const css = buildChartCss('chart-1', {
      desktop: { color: '#2563eb' },
      mobile: { theme: { light: 'hsl(210 90% 60%)', dark: 'rgb(30, 64, 175)' } },
    }, THEMES);

    expect(css).toContain('[data-chart="chart-1"]');
    expect(css).toContain('--color-desktop: #2563eb;');
    expect(css).toContain('--color-mobile: hsl(210 90% 60%);');
    expect(css).toContain('.dark [data-chart="chart-1"]');
    expect(css).toContain('--color-mobile: rgb(30, 64, 175);');
  });

  it('encodes selector and variable identifiers instead of dropping distinct characters', () => {
    const css = buildChartCss('sales/chart', {
      'mobile users': { color: 'rebeccapurple' },
    }, { light: '' });

    expect(css).toContain('[data-chart="sales-2f-chart"]');
    expect(css).toContain('--color-mobile-20-users: rebeccapurple;');
  });

  it.each([
    '#123456; } </style><script>alert(1)</script>',
    'url(javascript:alert(1))',
    'red\nbackground:url(https://evil.example)',
    'var(--safe)/*breakout*/',
  ])('rejects unsafe CSS values: %s', (color) => {
    const css = buildChartCss('safe-chart', { unsafe: { color } }, THEMES);
    expect(css).toBe('');
  });

  it('rejects non-string and oversized values', () => {
    expect(buildChartCss('safe-chart', { unsafe: { color: 123 } }, THEMES)).toBe('');
    expect(buildChartCss('safe-chart', { unsafe: { color: `#${'a'.repeat(140)}` } }, THEMES)).toBe('');
  });

  it('normalizes arbitrary identifiers to a bounded CSS-safe form', () => {
    const identifier = toSafeCssIdentifier('</style><script>alert(1)</script>');
    expect(identifier).toMatch(/^[a-zA-Z0-9_-]+$/);
    expect(identifier).not.toContain('<');
    expect(identifier).not.toContain('>');
  });
});
