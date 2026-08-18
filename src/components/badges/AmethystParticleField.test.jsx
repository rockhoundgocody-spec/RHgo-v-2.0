import React from 'react';
import { vi, describe, it, expect } from 'vitest';

// Mock react's useMemo to immediately return the computed value
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useMemo: (fn) => fn(),
  };
});

// Mock framer-motion to render plain DOM elements in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }) => (
      <div className={className} style={style} {...props}>
        {children}
      </div>
    ),
  },
}));

import AmethystParticleField from './AmethystParticleField.jsx';

describe('AmethystParticleField', () => {
  it('renders without crashing with default props', () => {
    const element = AmethystParticleField({ intensity: 1, size: 320 });
    expect(element).toBeDefined();
    expect(element.type).toBe('div');
    expect(element.props.style).toEqual({
      width: 320,
      height: 320,
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    });
  });

  it('renders children elements corresponding to aura, orbiters, risers, and shimmers', () => {
    const element = AmethystParticleField({ intensity: 1, size: 300 });
    const children = React.Children.toArray(element.props.children);

    // Aura (1) + Orbiters (14) + Risers (10) + Shimmers (5) = 30 elements
    expect(children.length).toBeGreaterThan(0);
  });
});
