import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock framer-motion to simplify element tree inspection if needed
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }) => React.createElement('div', { className, style, 'data-testid': 'motion-div', ...props }, children),
  },
}));

import TestSelector from './TestSelector.jsx';

describe('TestSelector', () => {
  it('returns null if nextTest is not provided', () => {
    const result = TestSelector({ nextTest: null, onEnterResult: () => {}, loading: false });
    expect(result).toBeNull();
  });

  it('renders test component structure with correct props and category config', () => {
    const sampleTest = {
      test_name: 'Acid Streak Test',
      category: 'laboratory',
      expected_info_gain: 0.85,
      cost: '$15',
      time: '10 mins',
      risk: 'Medium',
      rationale: 'Tests effervescence with dilute HCl.',
      expected_outcome_leading: 'Effervesces strongly',
      expected_outcome_alternative: 'No reaction',
    };

    const handleEnter = vi.fn();
    const tree = TestSelector({ nextTest: sampleTest, onEnterResult: handleEnter, loading: false });

    expect(tree).not.toBeNull();
    // tree is motion.div
    const children = React.Children.toArray(tree.props.children);
    // Should have card body div and button
    expect(children.length).toBe(2);

    const button = children[1];
    expect(button.type).toBe('button');
    expect(button.props.disabled).toBe(false);

    // Trigger onClick
    button.props.onClick();
    expect(handleEnter).toHaveBeenCalledTimes(1);
  });

  it('renders loading state correctly on the action button', () => {
    const sampleTest = {
      test_name: 'Hardness Test',
      category: 'home',
      expected_info_gain: 0.5,
    };

    const tree = TestSelector({ nextTest: sampleTest, onEnterResult: () => {}, loading: true });
    const children = React.Children.toArray(tree.props.children);
    const button = children[1];

    expect(button.props.disabled).toBe(true);
    expect(button.props.children).toBe('Reconstructing histories…');
  });

  it('falls back to default category when category is unknown or unconfigured', () => {
    const sampleTest = {
      test_name: 'Custom Unknown Test',
      category: 'unknown_cat',
      expected_info_gain: 0,
    };

    const tree = TestSelector({ nextTest: sampleTest, onEnterResult: () => {}, loading: false });
    expect(tree).not.toBeNull();
  });
});
