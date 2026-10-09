import { describe, it, expect } from 'vitest';
import { buildGalaxy } from '@/lib/vaultGraph';
describe('vault private photo references', () => {
  it('marks private photos without copying the underlying storage URI into the graph', () => {
    const graph = buildGalaxy({ logs: [{ id: 'private-log', mineral_name: 'Quartz', image_uri: 'private://do-not-expose', image_url: 'https://old-public.example.test/image' }] });
    const node = graph.nodes.find(node => node.kind === 'log');
    expect(node.privatePhoto).toBe(true); expect(node.image).toBe(null); expect(JSON.stringify(node)).not.toContain('private://do-not-expose');
  });
});