import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children)
  }
}));

import TestSelector from './TestSelector.jsx';

function renderToJSON(element) {
  if (element === null || element === undefined || typeof element === 'boolean') {
    return null;
  }
  if (typeof element === 'string' || typeof element === 'number') {
    return String(element);
  }
  if (Array.isArray(element)) {
    return element.map(renderToJSON);
  }
  if (React.isValidElement(element)) {
    const type = typeof element.type === 'function' ? element.type : element.type;
    const props = element.props || {};

    if (typeof element.type === 'function') {
      const rendered = element.type(props);
      return renderToJSON(rendered);
    }

    return {
      type,
      props: {
        ...props,
        children: renderToJSON(props.children)
      }
    };
  }
  return '';
}

function findTextContent(tree) {
  if (!tree) return '';
  if (typeof tree === 'string') return tree;
  if (Array.isArray(tree)) return tree.map(findTextContent).join(' ');
  if (tree.props && tree.props.children) return findTextContent(tree.props.children);
  return '';
}

describe('TestSelector', () => {
  it('returns null when nextTest is null or undefined', () => {
    expect(TestSelector({ nextTest: null })).toBeNull();
    expect(TestSelector({ nextTest: undefined })).toBeNull();
  });

  it('renders correctly with complete nextTest data and fallback category', () => {
    const nextTest = {
      category: 'unknown_cat',
      test_name: 'Acid Test',
      expected_info_gain: 0.824,
      cost: '$10',
      time: '2 mins',
      risk: 'Medium',
      rationale: 'Tests effervescence with HCl.',
      expected_outcome_leading: 'Fizzing expected for Calcite',
      expected_outcome_alternative: 'No reaction for Quartz'
    };
    const onEnterResult = vi.fn();

    const element = TestSelector({ nextTest, onEnterResult, loading: false });
    const json = renderToJSON(element);
    const text = findTextContent(json);

    expect(text).toContain('Acid Test');
    expect(text).toContain('Home Test'); // Fallback category label
    expect(text).toContain('82 %'); // Math.round(0.824 * 100)
    expect(text).toContain('$10');
    expect(text).toContain('2 mins');
    expect(text).toContain('Medium');
    expect(text).toContain('Tests effervescence with HCl.');
    expect(text).toContain('Fizzing expected for Calcite');
    expect(text).toContain('No reaction for Quartz');
    expect(text).toContain('Enter Test Result');
  });

  it('handles missing/default values gracefully', () => {
    const nextTest = {
      category: 'expert',
      test_name: 'Refractive Index'
    };

    const element = TestSelector({ nextTest, onEnterResult: () => {}, loading: false });
    const json = renderToJSON(element);
    const text = findTextContent(json);

    expect(text).toContain('Refractive Index');
    expect(text).toContain('Expert Test');
    expect(text).toContain('0 %'); // Default gain
    expect(text).toContain('—'); // Default cost/time/risk dash
  });

  it('displays loading state on action button', () => {
    const nextTest = {
      category: 'laboratory',
      test_name: 'X-Ray Diffraction'
    };

    const element = TestSelector({ nextTest, onEnterResult: () => {}, loading: true });
    const json = renderToJSON(element);
    const text = findTextContent(json);

    expect(text).toContain('Reconstructing histories…');
  });
});
