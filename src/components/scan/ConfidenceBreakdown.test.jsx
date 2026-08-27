import { vi, describe, it, expect } from 'vitest';

vi.hoisted(() => {
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = {
      self: {},
      top: {},
    };
  }
});

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
  };
});

import ConfidenceBreakdown from './ConfidenceBreakdown.jsx';

describe('ConfidenceBreakdown', () => {
  const mockTop = { name: 'Amethyst', confidence: 92, scientificName: 'SiO2' };
  const mockCandidates = [
    mockTop,
    { name: 'Quartz', confidence: 75, scientificName: 'SiO2' },
    { name: 'Fluorite', confidence: 45, scientificName: 'CaF2' },
  ];

  it('renders null when topCandidate is not provided', () => {
    const result = ConfidenceBreakdown({ topCandidate: null });
    expect(result).toBeNull();
  });

  it('renders top candidate info correctly', () => {
    const element = ConfidenceBreakdown({ topCandidate: mockTop, candidates: [mockTop] });
    expect(element).not.toBeNull();
  });

  it('renders accordion button with proper ARIA attributes when multiple candidates exist', () => {
    const element = ConfidenceBreakdown({ topCandidate: mockTop, candidates: mockCandidates });
    expect(element).not.toBeNull();

    // Check tree structure for button attributes
    const children = element.props.children;
    const buttonChild = children.find(
      (c) => c && c.type === 'button'
    );
    expect(buttonChild).toBeDefined();
    expect(buttonChild.props['aria-expanded']).toBe(false);
    expect(buttonChild.props['aria-controls']).toBe('confidence-candidates-list');
  });
});
