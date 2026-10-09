// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, screen, waitFor, cleanup } from '@testing-library/react';
const mocks = vi.hoisted(() => ({ flush: vi.fn(), refresh: vi.fn(), items: [{ queueId: 'test-pin', data: { mineral_name: 'Quartz', lat: 42, lng: -83 }, blocked: true }] }));
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => ({ user: { id: 'test-owner' } }) }));
vi.mock('@/hooks/useOfflineQueueStatus', () => ({ default: () => ({ items: mocks.items, error: '', refresh: mocks.refresh }) }));
vi.mock('@/lib/offlineQueue', () => ({ flushQueue: mocks.flush }));
vi.mock('@/components/visuals/GlassPanel.jsx', () => ({ default: ({ children, ...props }) => <div {...props}>{children}</div> }));
import OfflineFindRecovery from '@/components/settings/OfflineFindRecovery';
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
describe('offline recovery controls', () => {
  it('shows retained pins and retries them through the real button handler', async () => {
    mocks.flush.mockResolvedValue({ flushed: 1, remaining: 0 });
    render(<OfflineFindRecovery />);
    expect(screen.getByText(/1 saved on this device/).textContent).toContain('1 need attention');
    fireEvent.click(screen.getByRole('button', { name: 'Retry sync' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('1 finds synced'));
    expect(mocks.flush).toHaveBeenCalledWith({ retryBlocked: true }); expect(mocks.refresh).toHaveBeenCalled();
  });
  it('provides a download and warns that its locations are private', () => {
    const create = vi.fn(() => 'blob:backup');
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: create });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<OfflineFindRecovery />); fireEvent.click(screen.getByRole('button', { name: 'Download backup' }));
    expect(create).toHaveBeenCalled(); expect(click).toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toContain('private locations'); click.mockRestore();
  });
  it('keeps the retry control usable after a sync failure', async () => {
    mocks.flush.mockRejectedValue(new Error('Still offline'));
    render(<OfflineFindRecovery />); fireEvent.click(screen.getByRole('button', { name: 'Retry sync' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Still offline'));
    expect(screen.getByRole('button', { name: 'Retry sync' }).disabled).toBe(false);
  });
});