import { describe, it, expect } from 'vitest';
import { lookupMineralIntelligence, MINERAL_REGISTRY } from './mindatApi';

describe('mindatApi', () => {
  it('has comprehensive mineral data entries', () => {
    expect(MINERAL_REGISTRY['agate']).toBeDefined();
    expect(MINERAL_REGISTRY['calcite'].formula).toBe('CaCO₃');
    expect(MINERAL_REGISTRY['yooperlite'].uv_fluorescence).toContain('365nm');
  });

  it('accurately resolves mineral intelligence lookups', () => {
    const lsa = lookupMineralIntelligence('Lake Superior Agate');
    expect(lsa).toBeDefined();
    expect(lsa.hardness).toContain('7.0');

    const yoop = lookupMineralIntelligence('yooperlite rock');
    expect(yoop).toBeDefined();
    expect(yoop.name).toContain('Yooperlite');

    const calcite = lookupMineralIntelligence('calcite');
    expect(calcite.cleavage).toContain('rhombohedral');
  });

  it('handles unrecognized queries gracefully', () => {
    expect(lookupMineralIntelligence('unknown_random_mineral_12345')).toBeNull();
    expect(lookupMineralIntelligence('')).toBeNull();
    expect(lookupMineralIntelligence(null)).toBeNull();
  });
});
