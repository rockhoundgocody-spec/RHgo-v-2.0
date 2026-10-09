import { describe, it, expect, vi, afterEach } from 'vitest';
import { withSessionTimeout } from '@/lib/sessionTimeout';
afterEach(() => vi.useRealTimers());
describe('Session recovery', () => {
  it('rejects a hung check after six seconds', async () => {
    vi.useFakeTimers();
    const check = withSessionTimeout(new Promise(() => {}));
    const assertion = expect(check).rejects.toMatchObject({ code: 'session_timeout' });
    await vi.advanceTimersByTimeAsync(6000);
    await assertion;
  });
  it('clears the deadline when the session resolves', async () => {
    vi.useFakeTimers();
    await expect(withSessionTimeout(Promise.resolve({ id: 'owner-1' }))).resolves.toEqual({ id: 'owner-1' });
    expect(vi.getTimerCount()).toBe(0);
  });
});