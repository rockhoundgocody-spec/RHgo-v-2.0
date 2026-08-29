import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock react's useState and useId to support calling components directly as pure functions
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
    useId: () => 'test-id-123',
  };
});

// Mock framer-motion to simplify rendering in Vitest
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    circle: (props) => <circle {...props} />,
  },
}));

import HypothesisCard from './HypothesisCard.jsx';

describe('HypothesisCard component', () => {
  const sampleHypothesis = {
    name: 'Meteoritic Impact Shatter',
    category: 'extraterrestrial',
    description: 'High pressure shock metamorphism evidence',
    probability: 0.85,
    evidence_quality: 0.9,
    contradiction_load: 0.1,
    verification_depth: 0.8,
  };

  it('renders correctly with ARIA attributes and focus styling', () => {
    const element = HypothesisCard({ hypothesis: sampleHypothesis, isLeading: true, rank: 0 });
    expect(element).not.toBeNull();

    // Header button check
    const button = element.props.children[0];
    expect(button.props.type).toBe('button');
    expect(button.props['aria-expanded']).toBe(true);
    expect(button.props['aria-controls']).toBeDefined();
    expect(button.props['aria-label']).toContain('Collapse Meteoritic Impact Shatter hypothesis details');
    expect(button.props.className).toContain('focus-visible:ring-2');
  });

  it('renders collapsed state aria-label when isLeading is false', () => {
    const element = HypothesisCard({ hypothesis: sampleHypothesis, isLeading: false, rank: 1 });
    const button = element.props.children[0];
    expect(button.props['aria-expanded']).toBe(false);
    expect(button.props['aria-label']).toContain('Expand Meteoritic Impact Shatter hypothesis details');
  });
});
