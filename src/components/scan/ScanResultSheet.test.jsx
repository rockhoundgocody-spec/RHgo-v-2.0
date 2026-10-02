import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, role, className, style, ...props }) => {
      const filteredProps = {};
      Object.keys(props).forEach((key) => {
        if (
          key.startsWith('aria-') ||
          key.startsWith('data-') ||
          key === 'id' ||
          key === 'onClick'
        ) {
          filteredProps[key] = props[key];
        }
      });
      return (
        <div role={role} className={className} style={style} {...filteredProps}>
          {children}
        </div>
      );
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to, className }) => <a href={to} className={className}>{children}</a>,
}));

vi.mock('@/components/scan/FoundLocationPicker.jsx', () => ({
  default: () => <div data-testid="found-location-picker" />,
}));

import ScanResultSheet from './ScanResultSheet';

describe('ScanResultSheet', () => {
  const dummyResult = {
    top_match: 'Quartz Crystal',
    scientific_name: 'SiO2',
    chemical_formula: 'SiO2',
    confidence: 0.92,
    description: 'A beautiful hexagonal quartz crystal.',
    observed_features: [
      { feature: 'luster', value: 'vitreous' },
      { feature: 'hardness', value: '7' },
    ],
    candidates: [{ name: 'Quartz', confidence: 0.92 }],
    lookalikes: [{ name: 'Calcite', differentiator: 'softer, fizzes with acid' }],
    field_habit: 'Prismatic',
    field_luster: 'Vitreous',
    field_matrix: 'Granite',
    field_next_test: 'Acid test',
  };

  it('renders dialog container with proper ARIA attributes and focus styles', () => {
    const html = renderToStaticMarkup(
      <ScanResultSheet
        open={true}
        result={dummyResult}
        imageUrl="https://example.com/quartz.jpg"
        provenance="nature"
        onClose={vi.fn()}
      />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="Scan result details"');
    expect(html).toContain('aria-label="Close scan result panel"');
    expect(html).toContain('focus-visible:ring-2');
    expect(html).toContain('Quartz Crystal');
  });

  it('renders input labels associated with inputs and provenance toggle buttons', () => {
    const html = renderToStaticMarkup(
      <ScanResultSheet
        open={true}
        result={dummyResult}
        provenance="nature"
        onProvenanceChange={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain('for="');
    expect(html).toContain('id="');
    expect(html).toContain('Habit');
    expect(html).toContain('Luster');
    expect(html).toContain('Matrix');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
  });

  it('renders fail state retry button with proper type and focus styles', () => {
    const failResult = {
      image_quality_score: 0.1,
    };
    const html = renderToStaticMarkup(
      <ScanResultSheet
        open={true}
        result={failResult}
        onRetry={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain('Need more light');
    expect(html).toContain('type="button"');
    expect(html).toContain('focus-visible:ring-emerald-400/60');
  });
});
