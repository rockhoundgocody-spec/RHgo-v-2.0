import React from 'react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useId: () => ':r0:',
  };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

import CaseFileLedger from './CaseFileLedger.jsx';

describe('CaseFileLedger', () => {
  it('renders trigger button with correct ARIA attributes when collapsed', () => {
    const onToggle = vi.fn();
    const element = CaseFileLedger({
      evidence: [{ source: 'Visual', observation: 'Shiny', reliability: 0.9 }],
      contradictions: [{ severity: 'high', description: 'Color mismatch' }],
      missing: ['Density test'],
      showLedger: false,
      onToggleLedger: onToggle,
    });

    const triggerBtn = element.props.children[0];
    expect(triggerBtn.props.type).toBe('button');
    expect(triggerBtn.props['aria-expanded']).toBe(false);
    expect(triggerBtn.props['aria-controls']).toBe(':r0:');
    expect(triggerBtn.props['aria-label']).toBe('Expand case file ledger');
    expect(triggerBtn.props.className).toContain('focus-visible:ring-2');
    expect(triggerBtn.props.className).toContain('focus-visible:ring-amethyst-glow/50');

    // Collapsed state means body is false / null
    const bodyContainer = element.props.children[1];
    expect(bodyContainer).toBe(false);
  });

  it('renders trigger button and expandable panel with matching id when expanded', () => {
    const onToggle = vi.fn();
    const element = CaseFileLedger({
      evidence: [{ source: 'Visual', observation: 'Shiny', reliability: 0.9 }],
      contradictions: [{ severity: 'high', description: 'Color mismatch' }],
      missing: ['Density test'],
      showLedger: true,
      onToggleLedger: onToggle,
    });

    const triggerBtn = element.props.children[0];
    expect(triggerBtn.props['aria-expanded']).toBe(true);
    expect(triggerBtn.props['aria-label']).toBe('Collapse case file ledger');

    const bodyContainer = element.props.children[1];
    expect(bodyContainer).toBeDefined();
    expect(bodyContainer.props.id).toBe(':r0:');
  });
});
