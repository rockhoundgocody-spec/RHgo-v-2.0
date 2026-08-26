import { describe, it, expect, vi } from 'vitest';

const motionPreference = vi.hoisted(() => ({ reduced: false }));

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_target, property) => property }),
  useReducedMotion: () => motionPreference.reduced,
}));

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useMemo: (factory) => factory(),
  };
});

import AmethystParticleField, {
  generateOrbiters,
  generateRisers,
  generateShimmers,
} from './AmethystParticleField.jsx';

describe('AmethystParticleField generator functions', () => {
  it('generateOrbiters produces correct number of orbiters based on intensity', () => {
    const orbiters1 = generateOrbiters(1);
    expect(orbiters1).toHaveLength(14);

    const orbitersHalf = generateOrbiters(0.5);
    expect(orbitersHalf).toHaveLength(7);

    const orbiter = orbiters1[0];
    expect(orbiter).toHaveProperty('angle');
    expect(orbiter).toHaveProperty('radius');
    expect(orbiter).toHaveProperty('speed');
    expect(orbiter).toHaveProperty('size');
    expect(orbiter).toHaveProperty('color');
    expect(orbiter).toHaveProperty('delay');
    expect(orbiter).toHaveProperty('direction');
  });

  it('generateRisers produces correct number of risers based on intensity', () => {
    const risers1 = generateRisers(1);
    expect(risers1).toHaveLength(10);

    const risers2 = generateRisers(2);
    expect(risers2).toHaveLength(20);

    const riser = risers1[0];
    expect(riser).toHaveProperty('x');
    expect(riser).toHaveProperty('startY');
    expect(riser).toHaveProperty('drift');
    expect(riser).toHaveProperty('size');
    expect(riser).toHaveProperty('dur');
    expect(riser).toHaveProperty('delay');
    expect(riser).toHaveProperty('color');
  });

  it('generateShimmers produces correct number of shimmers based on intensity', () => {
    const shimmers1 = generateShimmers(1);
    expect(shimmers1).toHaveLength(5);

    const shimmers2 = generateShimmers(1.6);
    expect(shimmers2).toHaveLength(8);

    const shimmer = shimmers1[0];
    expect(shimmer).toHaveProperty('x');
    expect(shimmer).toHaveProperty('y');
    expect(shimmer).toHaveProperty('size');
    expect(shimmer).toHaveProperty('dur');
    expect(shimmer).toHaveProperty('delay');
  });
});

describe('AmethystParticleField component function', () => {
  it('returns a JSX element without throwing', () => {
    motionPreference.reduced = false;
    const element = AmethystParticleField({ intensity: 1, size: 300 });
    expect(element).toBeDefined();
    expect(element.type).toBe('div');
    expect(element.props.style).toEqual({
      width: 300,
      height: 300,
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    });
  });

  it('omits continuously animated particle layers when reduced motion is requested', () => {
    motionPreference.reduced = true;
    const element = AmethystParticleField({ intensity: 1, size: 300 });

    expect(element.props.children[1]).toEqual([]);
    expect(element.props.children[2]).toEqual([]);
    expect(element.props.children[3]).toEqual([]);
    motionPreference.reduced = false;
  });
});
