import { describe, it, expect } from 'vitest';
import { parseCloverCommand, routeForTarget, INTENTS } from './cloverCommandRouter';
import { applyCloverUtterance } from './cloverRuntime';

describe('Clover voice routing', () => {
  it('routes every pull to a screen that exists', () => {
    expect(routeForTarget('Sweetwater barite')).toBe('/vault?q=Sweetwater%20barite');
    expect(routeForTarget('the BLM wash site')).toBe('/vault?q=the%20BLM%20wash%20site');
    expect(routeForTarget('hotspot map')).toBe('/explore');
    expect(routeForTarget('trip itinerary')).toBe('/expeditions');
    expect(routeForTarget('ebay listing')).toBe('/market');
  });

  it('opens the galaxy for "pull" commands', () => {
    const cmd = parseCloverCommand('Hey Clover, pull Sweetwater barite');
    expect(cmd.intent).toBe(INTENTS.PULL);
    // Spoken targets are matched case-insensitively, so they arrive lowercased.
    expect(cmd.route).toBe('/vault?q=sweetwater%20barite');
    const out = applyCloverUtterance('Clover, pull Sweetwater barite');
    expect(out.handled).toBe(true);
    expect(out.navigateTo).toBe('/vault?q=sweetwater%20barite');
  });

  it('opens the live scanner for "what do you see"', () => {
    expect(applyCloverUtterance('what do you see').navigateTo).toBe('/scan?live=1');
  });

  it('sends research and vault questions to the server brain', () => {
    const research = applyCloverUtterance('research BLM casual collecting rules');
    expect(research.handled).toBe(false);
    expect(research.researchQuery).toBe('BLM casual collecting rules');
    expect(research.navigateTo).toBeUndefined();

    const ask = applyCloverUtterance('how many agates did I find at Grand Marais');
    expect(ask.handled).toBe(false);
    expect(ask.passToChat).toBe(true);
  });
});
