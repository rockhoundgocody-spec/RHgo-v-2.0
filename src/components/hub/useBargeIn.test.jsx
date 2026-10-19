// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import useBargeIn from '@/components/hub/useBargeIn';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('closes a late microphone stream rather than replacing a newer session', async () => {
  let firstResolve; const first = new Promise(r => { firstResolve = r; });
  const oldTrack = { stop: vi.fn() }, newTrack = { stop: vi.fn() };
  const getUserMedia = vi.fn().mockReturnValueOnce(first).mockResolvedValueOnce({ getTracks: () => [newTrack] });
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } }); vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1)); vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('AudioContext', class { state = 'running'; createAnalyser() { return { fftSize: 512, frequencyBinCount: 256 }; } createMediaStreamSource() { return { connect: vi.fn() }; } close() { return Promise.resolve(); } });
  const hook = renderHook(() => useBargeIn(vi.fn())); let pending;
  act(() => { pending = hook.result.current.start(); }); act(() => hook.result.current.stop());
  await act(async () => { await hook.result.current.start(); firstResolve({ getTracks: () => [oldTrack] }); await pending; });
  expect(oldTrack.stop).toHaveBeenCalled(); expect(newTrack.stop).not.toHaveBeenCalled(); hook.unmount(); expect(newTrack.stop).toHaveBeenCalled();
});