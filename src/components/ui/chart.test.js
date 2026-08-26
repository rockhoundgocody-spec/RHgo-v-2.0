import { describe, expect, it } from 'vitest';
import { buildChartCss, toSafeCssIdentifier } from './chartCss.js';

describe('chart CSS generation', () => {
  it('preserves supported chart colors and theme variants', () => {
    const css = buildChartCss('finds', {
      quartz: { color: 'hsl(var(--chart-1))' },
      agate: { theme: { light: '#7c3aed', dark: 'oklch(0.8 0.1 280)' } },
    });

    expect(css).toContain('[data-chart="finds"]');
    expect(css).toContain('--color-quartz: hsl(var(--chart-1));');
    expect(css).toContain('--color-agate: #7c3aed;');
    expect(css).toContain('--color-agate: oklch(0.8 0.1 280);');
  });

  it('encodes selector and variable identifiers without collisions from punctuation', () => {
    expect(toSafeCssIdentifier('chart"] .other')).toBe('chart-22--5d--20--2e-other');
    expect(toSafeCssIdentifier('rare/color')).toBe('rare-2f-color');
  });

  it('drops values that could escape a CSS declaration or style element', () => {
    const css = buildChartCss('safe', {
      valid: { color: '#7c3aed' },
      declarationBreakout: { color: 'red; background:url(https://evil.test)' },
      styleBreakout: { color: '</style><script>alert(1)</script>' },
      commentBreakout: { color: 'red/* injected */' },
    });

    expect(css).toContain('--color-valid: #7c3aed;');
    expect(css).not.toContain('evil.test');
    expect(css).not.toContain('<script>');
    expect(css).not.toContain('injected');
    expect(css).not.toContain('--color-declarationBreakout');
  });
});
