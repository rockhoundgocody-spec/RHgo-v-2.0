// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSpeechSynthesis } from '@/components/oracle/useSpeech';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@/api/base44Client', () => ({ base44: { functions: { invoke } } }));
vi.mock('@/lib/guestDevice', () => ({ getOrCreateGuestId: () => 'voice-test' }));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
let sources, synth, decode;
const response = { data: { audioUrl: '/voice-test.mp3' } };
async function begin(hook, text = 'Hello') {
  let pending;
  await act(async () => {
    pending = hook.result.current.speak(text);
    await vi.dynamicImportSettled();
  });
  return { pending };
}
beforeEach(() => {
  vi.useFakeTimers();
  invoke.mockReset();
  sources = [];
  decode = vi.fn(async () => ({ duration: 1 }));
  synth = new EventTarget();
  synth.getVoices = vi.fn(() => [{ name: 'Samantha', lang: 'en-US' }]);
  synth.speak = vi.fn();
  synth.cancel = vi.fn();
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(text) { this.text = text; } });
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) })));
  vi.stubGlobal('AudioContext', class {
    state = 'running';
    destination = {};
    decodeAudioData(data) { return decode(data); }
    createAnalyser() { return { frequencyBinCount: 256, connect: vi.fn(), getByteFrequencyData: vi.fn() }; }
    createGain() { return { gain: {}, connect: vi.fn() }; }
    createBufferSource() {
      const source = { playbackRate: {}, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn() };
      sources.push(source);
      return source;
    }
    close() { this.state = 'closed'; return Promise.resolve(); }
  });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Clover single-speaker playback', () => {
  it('prefers an American device voice over British and Irish voices', async () => {
    invoke.mockRejectedValue(new Error('offline'));
    const american = { name: 'Samantha', lang: 'en-US' };
    synth.getVoices.mockReturnValue([{ name: 'Moira', lang: 'en-IE' }, { name: 'British', lang: 'en-GB' }, american]);
    const hook = renderHook(() => useSpeechSynthesis());
    await act(async () => { await hook.result.current.speak('American fallback'); });
    expect(synth.speak.mock.calls[0][0].voice).toBe(american);
    expect(synth.speak.mock.calls[0][0].lang).toBe('en-US');
  });

  it('never substitutes a British-only device voice', async () => {
    invoke.mockRejectedValue(new Error('offline'));
    synth.getVoices.mockReturnValue([{ name: 'British', lang: 'en-GB' }]);
    const hook = renderHook(() => useSpeechSynthesis());
    await act(async () => { await hook.result.current.speak('No American voice'); });
    expect(synth.speak).not.toHaveBeenCalled();
    expect(hook.result.current.speaking).toBe(false);
  });

  it('ignores a synthesis response that arrives after Stop', async () => {
    const job = deferred();
    invoke.mockReturnValue(job.promise);
    const hook = renderHook(() => useSpeechSynthesis());
    const { pending } = await begin(hook);
    act(() => hook.result.current.stop());
    await act(async () => { job.resolve(response); await pending; });
    expect(sources).toHaveLength(0);
    expect(synth.speak).not.toHaveBeenCalled();
    expect(hook.result.current.speaking).toBe(false);
  });

  it('plays only the latest request when responses arrive out of order', async () => {
    const first = deferred(), second = deferred();
    invoke.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const hook = renderHook(() => useSpeechSynthesis());
    const a = await begin(hook, 'Old response');
    const b = await begin(hook, 'New response');
    await act(async () => { second.resolve(response); await b.pending; });
    await act(async () => { first.resolve(response); await a.pending; });
    expect(sources).toHaveLength(1);
    expect(sources[0].start).toHaveBeenCalledTimes(1);
    expect(hook.result.current.speaking).toBe(true);
  });

  it('stops playback in another Clover surface without stale cleanup silencing the new one', async () => {
    invoke.mockResolvedValue(response);
    const a = renderHook(() => useSpeechSynthesis());
    const b = renderHook(() => useSpeechSynthesis());
    await act(async () => { await a.result.current.speak('First surface'); });
    const staleEnd = sources[0].onended;
    await act(async () => { await b.result.current.speak('Second surface'); });
    expect(sources[0].stop).toHaveBeenCalledTimes(1);
    expect(a.result.current.speaking).toBe(false);
    const cancels = synth.cancel.mock.calls.length;
    a.unmount();
    act(() => staleEnd());
    expect(sources[1].stop).not.toHaveBeenCalled();
    expect(synth.cancel).toHaveBeenCalledTimes(cancels);
    expect(b.result.current.speaking).toBe(true);
  });

  it('does not start a buffer after cancellation during decoding', async () => {
    const decoding = deferred();
    invoke.mockResolvedValue(response);
    decode.mockReturnValue(decoding.promise);
    const hook = renderHook(() => useSpeechSynthesis());
    const { pending } = await begin(hook);
    expect(decode).toHaveBeenCalled();
    act(() => hook.result.current.stop());
    await act(async () => { decoding.resolve({ duration: 1 }); await pending; });
    expect(sources).toHaveLength(0);
  });

  it('does not fall back to speech for a cancelled failed request', async () => {
    const job = deferred();
    invoke.mockReturnValue(job.promise);
    const hook = renderHook(() => useSpeechSynthesis());
    const { pending } = await begin(hook);
    hook.unmount();
    await act(async () => { job.reject(new Error('late error')); await pending; });
    expect(synth.speak).not.toHaveBeenCalled();
  });

  it('speaks the browser fallback once even when voices load after the timeout', async () => {
    invoke.mockRejectedValue(new Error('offline'));
    synth.getVoices.mockReturnValue([]);
    const hook = renderHook(() => useSpeechSynthesis());
    await act(async () => { await hook.result.current.speak('Fallback'); });
    act(() => {
      synth.getVoices.mockReturnValue([{ name: 'Samantha', lang: 'en-US' }]);
      vi.advanceTimersByTime(500);
      synth.dispatchEvent(new Event('voiceschanged'));
    });
    expect(synth.speak).toHaveBeenCalledTimes(1);
  });

  it('removes pending fallback listeners and timers on Stop', async () => {
    invoke.mockRejectedValue(new Error('offline'));
    synth.getVoices.mockReturnValue([]);
    const hook = renderHook(() => useSpeechSynthesis());
    await act(async () => { await hook.result.current.speak('Cancelled fallback'); });
    act(() => hook.result.current.stop());
    act(() => { vi.advanceTimersByTime(500); synth.dispatchEvent(new Event('voiceschanged')); });
    expect(synth.speak).not.toHaveBeenCalled();
  });
});