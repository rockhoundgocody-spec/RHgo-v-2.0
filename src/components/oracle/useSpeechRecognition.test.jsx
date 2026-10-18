// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSpeechRecognition } from '@/components/oracle/useSpeech';
vi.mock('@/api/base44Client', () => ({ base44: {} }));
let recognizers;
const resultEvent = (text, final = true, confidence = 0.9) => { const r = [{ transcript: text, confidence }]; r.isFinal = final; return { resultIndex: 0, results: [r] }; };
beforeEach(() => {
  vi.useFakeTimers(); recognizers = [];
  vi.stubGlobal('SpeechRecognition', class { constructor() { this.start = vi.fn(); this.stop = vi.fn(); this.abort = vi.fn(); recognizers.push(this); } });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
describe('Native Clover microphone', () => {
  it('ends listening and delivers a final transcript exactly once', () => {
    const onResult = vi.fn(); const hook = renderHook(() => useSpeechRecognition({ onResult }));
    act(() => hook.result.current.start()); const rec = recognizers[0];
    act(() => { rec.onresult(resultEvent('Is this quartz?')); rec.onend(); });
    expect(onResult).toHaveBeenCalledExactlyOnceWith('Is this quartz?'); expect(hook.result.current.listening).toBe(false);
  });
  it('shows interim speech and flushes it when recognition ends', () => {
    const onResult = vi.fn(), onInterim = vi.fn(); const hook = renderHook(() => useSpeechRecognition({ onResult, onInterim }));
    act(() => hook.result.current.start()); const rec = recognizers[0];
    act(() => rec.onresult(resultEvent('white crystal', false))); expect(onInterim).toHaveBeenCalledWith('white crystal');
    act(() => rec.onend()); expect(onResult).toHaveBeenCalledWith('white crystal');
  });
  it('discards buffered words after Pause, including late results', () => {
    const onResult = vi.fn(); const hook = renderHook(() => useSpeechRecognition({ onResult }));
    act(() => hook.result.current.start()); const rec = recognizers[0], late = rec.onresult;
    act(() => { rec.onresult(resultEvent('cancelled', false)); hook.result.current.stop(); late(resultEvent('late')); });
    expect(onResult).not.toHaveBeenCalled(); expect(rec.abort).toHaveBeenCalled();
  });
  it('exposes permission errors and permits an explicit retry', () => {
    const hook = renderHook(() => useSpeechRecognition()); act(() => hook.result.current.start());
    act(() => recognizers[0].onerror({ error: 'not-allowed' }));
    expect(hook.result.current.listening).toBe(false); expect(hook.result.current.error).toContain('denied');
    act(() => hook.result.current.start()); expect(recognizers).toHaveLength(2); expect(hook.result.current.error).toBe('');
  });
  it('handles silence without inventing a transcript', () => {
    const onResult = vi.fn(); const hook = renderHook(() => useSpeechRecognition({ onResult })); act(() => hook.result.current.start());
    act(() => { vi.advanceTimersByTime(2800); recognizers[0].onend(); });
    expect(recognizers[0].stop).toHaveBeenCalled(); expect(onResult).not.toHaveBeenCalled(); expect(hook.result.current.error).toBe('');
  });
  it('aborts recognition and removes handlers on unmount', () => {
    const hook = renderHook(() => useSpeechRecognition()); act(() => hook.result.current.start()); const rec = recognizers[0]; hook.unmount();
    expect(rec.abort).toHaveBeenCalled(); expect(rec.onresult).toBeNull(); expect(vi.getTimerCount()).toBe(0);
  });
  it('ignores recognition errors arriving from a previous session', () => {
    const hook = renderHook(() => useSpeechRecognition()); act(() => hook.result.current.start()); const oldError = recognizers[0].onerror;
    act(() => { hook.result.current.start(); oldError({ error: 'not-allowed' }); });
    expect(hook.result.current.listening).toBe(true); expect(hook.result.current.error).toBe('');
  });
});