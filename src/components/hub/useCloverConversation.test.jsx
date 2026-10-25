// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useCloverConversation from './useCloverConversation';

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(), speak: vi.fn(), stop: vi.fn(), start: vi.fn(), invalidateQueries: vi.fn(),
  location: { pathname: '/' }, navigate: vi.fn(), voiceStart: vi.fn(), voiceStop: vi.fn(),
  voiceOptions: null, listening: false, voiceError: '', speaking: false,
}));
vi.mock('@/api/base44Client', () => ({ base44: { functions: { invoke: mocks.invoke } } }));
vi.mock('react-router-dom', () => ({ useLocation: () => mocks.location, useNavigate: () => mocks.navigate }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }) }));
vi.mock('@/components/oracle/useSpeech', () => ({ useSpeechSynthesis: () => ({ speak: mocks.speak, stop: mocks.stop, speaking: mocks.speaking, unlock: mocks.start }) }));
vi.mock('@/components/oracle/useVoiceInput', () => ({ default: opts => { mocks.voiceOptions = opts; return { start: mocks.voiceStart, stop: mocks.voiceStop, listening: mocks.listening, supported: true, error: mocks.voiceError }; } }));
vi.mock('./useBargeIn', () => ({ default: () => ({ start: mocks.start, stop: mocks.stop }) }));
vi.mock('@/lib/cloverMemory', () => ({ getCognitiveMemoryContext: () => '', recordRsiTurn: vi.fn() }));
vi.mock('@/lib/cloverWake', () => ({ setCloverBusy: vi.fn(), emit: vi.fn() }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/lib/guestDevice', () => ({ getOrCreateGuestId: () => 'test-guest' }));

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); mocks.listening = false; mocks.voiceError = ''; mocks.speaking = false; });
afterEach(() => { cleanup(); vi.useRealTimers(); });
const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };
const start = (result) => act(() => result.current.start('Hello'));

describe('Clover turn lifecycle', () => {
  it('ignores an old response after a conversation is restarted', async () => {
    const request = deferred(); mocks.invoke.mockReturnValue(request.promise);
    const { result } = renderHook(() => useCloverConversation()); start(result);
    let pending;
    await act(async () => { pending = result.current.send('Quartz?'); await Promise.resolve(); });
    act(() => { result.current.end(); result.current.start('New session'); });
    await act(async () => { request.resolve({ data: { reply: 'Old reply', log_find: true, find_details: 'quartz' } }); await pending; });
    expect(result.current.messages.map((m) => m.content)).toEqual(['New session']);
    expect(mocks.invoke).toHaveBeenCalledTimes(1);
  });
  it('prevents overlapping requests while thinking', async () => {
    const request = deferred(); mocks.invoke.mockReturnValue(request.promise);
    const { result } = renderHook(() => useCloverConversation()); start(result);
    let pending;
    await act(async () => { pending = result.current.send('Quartz?'); await Promise.resolve(); });
    await act(async () => { await result.current.send('Duplicate'); });
    expect(mocks.invoke).toHaveBeenCalledTimes(1);
    await act(async () => { request.resolve({ data: { reply: 'Quartz is a mineral.' } }); await pending; });
  });
  it('confirms a save only from a created record and refreshes collection', async () => {
    mocks.invoke.mockResolvedValueOnce({ data: { reply: 'Preparing', log_find: true, find_details: 'log quartz' } })
      .mockResolvedValueOnce({ data: { created: { id: 'fixture' }, fields: { mineral_name: 'Quartz' } } });
    const onFindLogged = vi.fn();
    const { result } = renderHook(() => useCloverConversation({ onFindLogged })); start(result);
    await act(async () => { await result.current.send('log quartz'); });
    expect(result.current.messages.at(-1).content).toBe('Saved Quartz to your collection.');
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['entity', 'Specimen'] });
    expect(onFindLogged).toHaveBeenCalledWith('Quartz');
  });
  it('reports missing save confirmation rather than falsely saying saved', async () => {
    mocks.invoke.mockResolvedValueOnce({ data: { reply: 'Saved!', log_find: true, find_details: 'log quartz' } })
      .mockResolvedValueOnce({ data: { fields: {} } });
    const { result } = renderHook(() => useCloverConversation()); start(result);
    await act(async () => { await result.current.send('log quartz'); });
    expect(result.current.messages.at(-1).content).toContain("couldn't confirm");
  });
  it('does not invent local hunt sites when the request fails', async () => {
    mocks.invoke.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useCloverConversation()); start(result);
    await act(async () => { await result.current.requestHuntSuggestions(); });
    expect(result.current.huntSuggestions.error).toBe(true);
    expect(result.current.huntSuggestions.suggestions).toEqual([]);
  });
  it('begins listening in the user gesture instead of first waiting for a greeting', () => {
    const { result } = renderHook(() => useCloverConversation());
    act(() => result.current.start('Ready', { listenFirst: true }));
    expect(mocks.voiceStart).toHaveBeenCalledTimes(1); expect(mocks.speak).not.toHaveBeenCalled(); expect(result.current.phase).toBe('listening');
  });
  it('takes a recognized utterance through chat and returns to listening after speech', async () => {
    mocks.invoke.mockResolvedValue({ data: { reply: 'Use a hand lens.', log_find: false } });
    const hook = renderHook(() => useCloverConversation({ scanContext: { label: 'Quartz', preview: true } }));
    act(() => hook.result.current.start('Ready', { listenFirst: true }));
    await act(async () => { mocks.voiceOptions.onResult('How can I check this?'); await vi.dynamicImportSettled(); });
    expect(mocks.invoke).toHaveBeenCalledWith('cloverChat', expect.objectContaining({ user_utterance: 'How can I check this?', scan_context: { label: 'Quartz', preview: true } }));
    expect(hook.result.current.messages.at(-1).content).toBe('Use a hand lens.');
    mocks.speaking = true; hook.rerender(); mocks.speaking = false; hook.rerender();
    expect(hook.result.current.phase).toBe('listening'); expect(mocks.voiceStart.mock.calls.length).toBeGreaterThan(1);
  });
  it('stops retrying on permission denial and supports an explicit resume', () => {
    const hook = renderHook(() => useCloverConversation()); act(() => hook.result.current.start('Ready', { listenFirst: true }));
    mocks.voiceError = 'Microphone denied'; hook.rerender();
    expect(hook.result.current.phase).toBe('resting'); act(() => vi.advanceTimersByTime(10000)); expect(mocks.voiceStart).toHaveBeenCalledTimes(1);
    mocks.voiceError = ''; hook.rerender(); act(() => hook.result.current.nudge()); expect(mocks.voiceStart).toHaveBeenCalledTimes(2);
  });
  it('pauses pending answers without losing the conversation history', async () => {
    const job = deferred(); mocks.invoke.mockReturnValue(job.promise); const hook = renderHook(() => useCloverConversation()); start(hook.result);
    let pending; await act(async () => { pending = hook.result.current.send('Quartz?'); await vi.dynamicImportSettled(); });
    act(() => hook.result.current.pause()); await act(async () => { job.resolve({ data: { reply: 'Late reply' } }); await pending; });
    expect(hook.result.current.phase).toBe('resting'); expect(hook.result.current.messages.at(-1).content).toBe('Quartz?'); expect(mocks.voiceStop).toHaveBeenCalled();
  });
  it('does not let late microphone denial interrupt a typed reply', async () => {
    const job = deferred(); mocks.invoke.mockReturnValue(job.promise); const hook = renderHook(() => useCloverConversation());
    act(() => hook.result.current.start('Ready', { listenFirst: true }));
    let pending; await act(async () => { pending = hook.result.current.send('What is quartz?'); await vi.dynamicImportSettled(); });
    mocks.voiceError = 'Microphone denied'; hook.rerender(); expect(hook.result.current.phase).toBe('thinking');
    await act(async () => { job.resolve({ data: { reply: 'Quartz is silicon dioxide.' } }); await pending; });
    expect(hook.result.current.messages.at(-1).content).toBe('Quartz is silicon dioxide.');
    act(() => vi.advanceTimersByTime(1200)); expect(hook.result.current.phase).toBe('resting'); expect(mocks.voiceStart).toHaveBeenCalledTimes(1);
  });
  it('recovers from a conversation timeout without duplicate requests', async () => {
    mocks.invoke.mockReturnValue(new Promise(() => {})); const hook = renderHook(() => useCloverConversation()); start(hook.result);
    let pending; await act(async () => { pending = hook.result.current.send('Question'); await vi.dynamicImportSettled(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); await pending; });
    expect(hook.result.current.messages.at(-1).content).toContain("couldn't reach"); expect(mocks.invoke).toHaveBeenCalledTimes(1); expect(hook.result.current.phase).toBe('speaking');
  });
});