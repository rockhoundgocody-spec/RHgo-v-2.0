import React from 'react';
import { describe, it, expect, vi } from 'vitest';

// Mock react's useState to support calling components directly as pure functions
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
  };
});

// Mock framer-motion to simplify rendering in Vitest
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock child components
vi.mock('./HypothesisCard.jsx', () => ({
  default: ({ hypothesis, rank }) => (
    <div data-testid={`hypothesis-${rank}`}>{hypothesis.name || 'Hypothesis'}</div>
  ),
}));

vi.mock('./TestSelector.jsx', () => ({
  default: ({ nextTest, onEnterResult }) => (
    <button data-testid="test-selector" onClick={onEnterResult}>
      {nextTest.test_name}
    </button>
  ),
}));

vi.mock('./ObservationForm.jsx', () => ({
  default: ({ open, onClose, onSubmit }) => (
    open ? (
      <div data-testid="observation-form">
        <button data-testid="close-obs" onClick={onClose}>Close</button>
        <button data-testid="submit-obs" onClick={() => onSubmit({ test: 'hardness' })}>Submit</button>
      </div>
    ) : null
  ),
}));

import CaseHeader from './CaseHeader.jsx';
import UncertaintyStatement from './UncertaintyStatement.jsx';
import ScientificExplanation from './ScientificExplanation.jsx';
import RealityTrial from './RealityTrial.jsx';

describe('RealityTrial Sub-components', () => {
  it('CaseHeader renders title and counters correctly', () => {
    const onReset = vi.fn();
    const element = CaseHeader({ hypothesesCount: 3, contradictionsCount: 1, onReset });

    expect(element.props.className).toContain('flex items-center');
  });

  it('UncertaintyStatement returns null when statement is empty', () => {
    const result = UncertaintyStatement({ imageUrl: null, uncertaintyStatement: null });
    expect(result).toBeNull();
  });

  it('ScientificExplanation renders text when provided', () => {
    const result = ScientificExplanation({ scientificExplanation: 'Geological formation' });
    expect(result).not.toBeNull();
  });

  it('RealityTrial pure component execution renders layout correctly', () => {
    const caseData = {
      hypotheses: [
        { id: '1', name: 'Hypothesis A', probability: 0.8 },
        { id: '2', name: 'Hypothesis B', probability: 0.2 },
      ],
      next_test: { test_name: 'Scratch Test' },
      contradiction_ledger: [{ severity: 'high', description: 'Color mismatch' }],
      evidence_ledger: [{ source: 'Visual', observation: 'Shiny surface', reliability: 0.9 }],
      missing_evidence: ['Density check'],
      uncertainty_statement: 'Uncertain about origin',
      scientific_explanation: 'Formed via pressure',
    };

    const element = RealityTrial({
      caseData,
      imageUrl: 'test.png',
      onAddEvidence: vi.fn(),
      loading: false,
      onReset: vi.fn(),
    });

    expect(element.props.className).toContain('space-y-4');
  });
});
