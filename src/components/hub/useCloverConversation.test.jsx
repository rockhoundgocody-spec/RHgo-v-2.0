// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useCloverConversation from './useCloverConversation';

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(), speak: vi.fn(), stop: vi.fn(), start: vi.fn(), invalidateQueries: vi.fn(),
  location: { pathname: '/' }, navigate: vi.fn(),
}));
vi.mock('@/api/base44Client', () => ({ base44: { functions: { invoke: mocks.invoke } } }));
vi.mock('react-router-dom', () => ({ useLocation: () => mocks.location, useNavigate: () => mocks.navigate }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }) }));
vi.mock('@/components/oracle/useSpeech', () => ({ useSpeechSynthesis: () => ({ speak: mocks.speak, stop: mocks.stop, speaking: false, unlock: mocks.start }) }));
vi.mock('@/components/oracle/useVoiceInput', () => ({ default: () => ({ start: mocks.start, stop: mocks.stop, listening: false }) }));
vi.mock('./useBargeIn', () => ({ default: () => ({ start: mocks.start, stop: mocks.stop }) }));
vi.mock('@/lib/cloverMemory', () => ({ getCognitiveMemoryContext: () => '', recordRsiTurn: vi.fn() }));
vi.mock('@/lib/cloverWake', () => ({ setCloverBusy: vi.fn(), emit: vi.fn() }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/lib/guestDevice', () => ({ getOrCreateGuestId: () => 'test-guest' }));

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });
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
});