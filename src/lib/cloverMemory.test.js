import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadCloverMemory,
  saveCloverMemory,
  recordDiscoveryToMemory,
  getCognitiveMemoryContext,
  clearCloverMemoryForTest,
  getRsiTelemetry,
  recordRsiTurn,
  runRsiSelfReflection,
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

  it('generates cognitive memory context string', () => {
    recordDiscoveryToMemory({ top_match: 'Yooperlite', rarity: 'legendary' });
    const ctx = getCognitiveMemoryContext();
    expect(ctx).toContain('Yooperlite');
    expect(ctx).toContain('Cognitive Memory');
    expect(ctx).toContain('RSI Gen');
  });

  it('evolves RSI generation and auto-skills through self-reflection cycles', () => {
    recordRsiTurn({ type: 'voice' });
    const before = getRsiTelemetry();
    expect(before.totalVoiceTurns).toBe(1);
    expect(before.autoSkills.length).toBeGreaterThanOrEqual(5);

    const after = runRsiSelfReflection();
    expect(after.rsiGeneration).toBeGreaterThan(before.rsiGeneration);
    expect(after.latestReflection).toBeTruthy();
  });
});