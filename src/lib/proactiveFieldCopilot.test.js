import { describe, it, expect } from 'vitest';
import { evaluateProactiveFieldSituation } from './proactiveFieldCopilot';
import { clearCloverMemoryForTest } from './cloverMemory';

describe('proactiveFieldCopilot', () => {
  it('detects Great Lakes shoreline zone and generates washout alert', async () => {
    clearCloverMemoryForTest();
    const alerts = await evaluateProactiveFieldSituation(46.78, -92.10);
    expect(Array.isArray(alerts)).toBe(true);
    const waveAlert = alerts.find(a => a.type === 'wave_washout');
    expect(waveAlert).toBeDefined();
    expect(waveAlert.title).toContain('Wave Washout');
  });

  it('returns null for invalid coordinates', async () => {
    clearCloverMemoryForTest();
    const alerts = await evaluateProactiveFieldSituation(NaN, null);
    expect(alerts).toBeNull();
  });
});
