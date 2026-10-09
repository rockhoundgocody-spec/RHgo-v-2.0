// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import useDailyScanQuota from './useDailyScanQuota';

beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-12-31T23:59:00Z')); });
afterEach(() => { vi.useRealTimers(); localStorage.clear(); });
it('keeps daily member counts separate and refreshes at midnight', () => {
  const hook = renderHook(({ id }) => useDailyScanQuota({ id }), { initialProps: { id: 'one' } });
  act(() => hook.result.current.setScansUsed(7));
  expect(hook.result.current.scansUsed).toBe(7);
  expect(localStorage.getItem('rhgo_daily_scans_one_2026-12-31')).toBe('7');
  hook.rerender({ id: 'two' });
  expect(hook.result.current.scansUsed).toBe(0);
  hook.rerender({ id: 'one' });
  expect(hook.result.current.scansUsed).toBe(7);
  act(() => vi.advanceTimersByTime(60000));
  expect(hook.result.current.scansUsed).toBe(0);
  expect(hook.result.current.guestQuota.limit).toBe(7);
  hook.unmount();
});