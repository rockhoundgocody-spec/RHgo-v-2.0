import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@/lib/orbAudio', () => ({
  triggerOrbHaptic: vi.fn(),
}));

import MohsScratchLab from './MohsScratchLab';

describe('MohsScratchLab', () => {
  it('renders tool buttons with accessible ARIA attributes and status container', () => {
    const html = renderToStaticMarkup(
      <MohsScratchLab
        specimenHardness={7.0}
        mineralName="Quartz"
        streakColor="White"
        isKidMode={false}
      />
    );

    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Scratch test tools"');
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('Steel Knife, hardness 5.5 Mohs');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focus-visible:ring-2');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });
});
