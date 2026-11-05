import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadCloverMemory,
  recordDiscoveryToMemory,
  recordConversationEpisode,
  syncCollectionToMemory,
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

  it('generates cognitive memory context string with episodic notes and synced collection', () => {
    recordDiscoveryToMemory({ top_match: 'Yooperlite', rarity: 'legendary', location_name: 'Lake Superior' });
    syncCollectionToMemory([
      { mineral_name: 'Red beryl', rarity: 'legendary', found_at: 'Wah Wah Mountains' },
    ]);
    recordConversationEpisode({
      userText: 'How do I test quartz vs calcite?',
      assistantReply: 'Try a quick scratch test with a steel knife or a drop of weak acid.',
      citedSources: [{ label: 'Red beryl', place: 'Wah Wah Mountains' }],
    });
    const ctx = getCognitiveMemoryContext();
    expect(ctx).toContain('Yooperlite');
    expect(ctx).toContain('Red beryl');
    expect(ctx).toContain('Wah Wah Mountains');
    expect(ctx).toContain('Past conversation notes');
  });
});