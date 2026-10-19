import { afterEach, expect, it, vi } from 'vitest';
import voiceTimeout from '@/lib/voiceTimeout';
afterEach(() => vi.useRealTimers());
it('returns conversation results and clears the timeout', async () => {
  vi.useFakeTimers(); expect(await voiceTimeout(Promise.resolve('answer'))).toBe('answer'); expect(vi.getTimerCount()).toBe(0);
});
it('releases an unresponsive conversation after thirty seconds', async () => {
  vi.useFakeTimers(); const pending = expect(voiceTimeout(new Promise(() => {}))).rejects.toThrow('timed out');
  await vi.advanceTimersByTimeAsync(30000); await pending; expect(vi.getTimerCount()).toBe(0);
});