import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadCloverMemory,
  saveCloverMemory,
  recordDiscoveryToMemory,
  recordWaypointToMemory,
  getCognitiveMemoryContext,
  clearCloverMemoryForTest,
} from './cloverMemory';

describe('cloverMemory', () => {
  beforeEach(() => {
    clearCloverMemoryForTest();
  });

  it('loads default cognitive memory when empty', () => {
    const mem = loadCloverMemory();
    expect(mem).toBeDefined();
    expect(mem.version).toBe(2);
    expect(mem.totalScans).toBe(0);
    expect(Array.isArray(mem.recentDiscoveries)).toBe(true);
  });

  it('records discovery into episodic memory', () => {
    recordDiscoveryToMemory({ top_match: 'Lake Superior Agate', rarity: 'rare' });
    const mem = loadCloverMemory();
    expect(mem.totalScans).toBe(1);
    expect(mem.recentDiscoveries.length).toBe(1);
    expect(mem.recentDiscoveries[0].mineral).toBe('Lake Superior Agate');
    expect(mem.favoriteMinerals).toContain('Lake Superior Agate');
  });

  it('records GPS waypoints', () => {
    recordWaypointToMemory(46.7867, -92.1005, 'Duluth Beach');
    const mem = loadCloverMemory();
    expect(mem.recentLocalities.length).toBe(1);
    expect(mem.recentLocalities[0].label).toBe('Duluth Beach');
  });

  it('generates cognitive memory context string', () => {
    recordDiscoveryToMemory({ top_match: 'Yooperlite', rarity: 'legendary' });
    const ctx = getCognitiveMemoryContext();
    expect(ctx).toContain('Yooperlite');
    expect(ctx).toContain('Cognitive Memory');
  });
});
