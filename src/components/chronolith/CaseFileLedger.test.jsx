// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CaseFileLedger from './CaseFileLedger.jsx';

describe('CaseFileLedger Accessibility and UX', () => {
  it('renders collapsed ledger button with proper ARIA attributes, visible button text, and focus ring', () => {
    const html = renderToStaticMarkup(
      <CaseFileLedger
        evidence={[{ source: 'scratch', observation: 'Scratches glass', reliability: 0.9 }]}
        contradictions={[{ severity: 'high', description: 'Streak color conflicts with hardness' }]}
        missing={['Check specific gravity']}
        showLedger={false}
        onToggleLedger={() => {}}
      />
    );

    // Explicit type="button"
    expect(html).toContain('type="button"');

    // ARIA expanded state
    expect(html).toContain('aria-expanded="false"');

    // No aria-label override so screen readers read internal summary text naturally
    expect(html).not.toContain('aria-label=');
    expect(html).toContain('Case File');
    expect(html).toContain('1 evidence · 1 contradictions · 1 missing');

    // Focus-visible ring
    expect(html).toContain('focus-visible:ring-2');
    expect(html).toContain('focus-visible:ring-amethyst-glow/50');

    // aria-controls attribute present and non-empty
    expect(html).toMatch(/aria-controls=":[a-zA-Z0-9]+:"/);

    // Decorative icons marked aria-hidden
    expect(html).toContain('aria-hidden="true"');

    // Content container not rendered when collapsed
    expect(html).not.toContain('Contradiction Ledger');
    expect(html).not.toContain('Evidence Ledger');
  });

  it('renders expanded ledger container with matching id when showLedger is true', () => {
    const html = renderToStaticMarkup(
      <CaseFileLedger
        evidence={[{ source: 'scratch', observation: 'Scratches glass', reliability: 0.9 }]}
        contradictions={[{ severity: 'high', description: 'Streak color conflicts with hardness' }]}
        missing={['Check specific gravity']}
        showLedger={true}
        onToggleLedger={() => {}}
      />
    );

    // ARIA expanded for expanded state
    expect(html).toContain('aria-expanded="true"');

    // Content elements visible
    expect(html).toContain('Contradiction Ledger');
    expect(html).toContain('Evidence Ledger');
    expect(html).toContain('Missing Evidence — Missions');

    // Check item data rendered
    expect(html).toContain('Streak color conflicts with hardness');
    expect(html).toContain('Scratches glass');
    expect(html).toContain('Check specific gravity');
  });
});
