// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import attachOrbMotion from './orbMotion';

let callbacks, sequence, preference, host, canvas, scene, stop;
function advance(now) {
  const pending = [...callbacks.values()]; callbacks.clear();
  pending.forEach(callback => callback(now));
}
beforeEach(() => {
  callbacks = new Map(); sequence = 0;
  preference = new EventTarget(); preference.matches = false;
  vi.stubGlobal('matchMedia', () => preference);
  vi.stubGlobal('requestAnimationFrame', callback => { callbacks.set(++sequence, callback); return sequence; });
  vi.stubGlobal('cancelAnimationFrame', id => callbacks.delete(id));
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  host = document.createElement('div'); canvas = document.createElement('canvas');
  host.appendChild(canvas); document.body.appendChild(host);
  scene = { draw: vi.fn(), resize: vi.fn(), dispose: vi.fn() };
  stop = attachOrbMotion(host, canvas, scene);
});
afterEach(() => { stop(); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe('landing render clock', () => {
  it('keeps advancing fluid surface time without CSS animation or interaction', () => {
    advance(1000); advance(1020); advance(1040);
    expect(scene.draw).toHaveBeenCalledTimes(3);
    expect(Number(host.dataset.orbTime)).toBeCloseTo(.04);
    expect(host.dataset.orbRenderer).toBe('webgl');
    expect(host.dataset.orbMotion).toBe('running');
    expect(callbacks.size).toBe(1);
  });
  it('renders static depth and cancels the loop when reduced motion is requested', () => {
    advance(1000); preference.matches = true; preference.dispatchEvent(new Event('change'));
    advance(1020);
    expect(scene.draw.mock.lastCall[2]).toBe(true);
    expect(host.dataset.orbMotion).toBe('reduced');
    expect(callbacks.size).toBe(0);
  });
  it('restores rendering after graphics-context recovery', () => {
    advance(1000);
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    expect(callbacks.size).toBe(0);
    expect(host.dataset.orbRenderer).toBe('fallback');
    canvas.dispatchEvent(new Event('webglcontextrestored')); advance(2000);
    expect(host.dataset.orbRenderer).toBe('webgl');
    expect(callbacks.size).toBe(1);
  });
  it('cleans up the render loop and graphics resources on unmount', () => {
    stop();
    expect(callbacks.size).toBe(0);
    expect(scene.dispose).toHaveBeenCalledOnce();
    stop = () => {};
  });
});