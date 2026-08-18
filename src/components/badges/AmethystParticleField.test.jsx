import { describe, it, expect, vi } from 'vitest';

// Mock React useMemo to execute callback immediately when calling component as function
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useMemo: (factory) => factory(),
  };
});

import AmethystParticleField from './AmethystParticleField.jsx';

describe('AmethystParticleField', () => {
  it('returns valid JSX tree with default props', () => {
    const vnode = AmethystParticleField({});
    expect(vnode).toBeTruthy();
    expect(vnode.props.style.width).toBe(320);
    expect(vnode.props.style.height).toBe(320);

    // Children array: aura (index 0), orbiters (index 1), risers (index 2), shimmers (index 3)
    const children = vnode.props.children;
    expect(children).toHaveLength(4);

    const [aura, orbiters, risers, shimmers] = children;
    expect(aura).toBeTruthy();
    expect(orbiters).toHaveLength(14); // Math.round(14 * 1)
    expect(risers).toHaveLength(10);  // Math.round(10 * 1)
    expect(shimmers).toHaveLength(5);  // Math.round(5 * 1)
  });

  it('calculates particle counts based on intensity and container size', () => {
    const vnode = AmethystParticleField({ intensity: 0.5, size: 200 });
    expect(vnode.props.style.width).toBe(200);
    expect(vnode.props.style.height).toBe(200);

    const [, orbiters, risers, shimmers] = vnode.props.children;
    expect(orbiters).toHaveLength(7); // Math.round(14 * 0.5)
    expect(risers).toHaveLength(5);  // Math.round(10 * 0.5)
    expect(shimmers).toHaveLength(3); // Math.round(5 * 0.5)
  });
});
