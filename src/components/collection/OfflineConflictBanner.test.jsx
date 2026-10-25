// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const { getQueuedConflicts, resolveQueuedConflict, toast } = vi.hoisted(() => ({
  getQueuedConflicts: vi.fn(),
  resolveQueuedConflict: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/lib/offlineQueue', () => ({
  getQueuedConflicts,
  resolveQueuedConflict,
}));

vi.mock('@/components/ui/use-toast', () => ({
  toast,
}));

import OfflineConflictBanner from './OfflineConflictBanner.jsx';

beforeEach(() => {
  getQueuedConflicts.mockReset();
  resolveQueuedConflict.mockReset();
  toast.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('OfflineConflictBanner', () => {
  it('renders nothing when there are no conflicts', async () => {
    getQueuedConflicts.mockResolvedValue([]);
    const { container } = render(<OfflineConflictBanner specimens={[]} />);
    await waitFor(() => expect(getQueuedConflicts).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  it('displays colliding fields and resolves with keep_local or keep_remote', async () => {
    const conflictItem = {
      id: 'spec-101',
      entity: 'Specimen',
      op: 'update',
      conflict: true,
      queuedAt: 1700000000000,
      data: { notes: 'Found near basalt ridge', rarity: 'rare' },
    };
    getQueuedConflicts
      .mockResolvedValueOnce([conflictItem])
      .mockResolvedValueOnce([]);
    resolveQueuedConflict.mockResolvedValue({ resolved: true, strategy: 'keep_local' });

    const onResolved = vi.fn();
    const specimens = [
      { id: 'spec-101', mineral_name: 'Red beryl', notes: 'Old server note', rarity: 'uncommon' },
    ];

    render(<OfflineConflictBanner specimens={specimens} onResolved={onResolved} />);

    expect(await screen.findByText('1 Offline Edit Collided')).toBeTruthy();
    expect(screen.getByText('Red beryl')).toBeTruthy();
    expect(screen.getByText('Found near basalt ridge')).toBeTruthy();
    expect(screen.getByText('Old server note')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Keep My Edit/i }));

    await waitFor(() => {
      expect(resolveQueuedConflict).toHaveBeenCalledWith('spec-101', 'keep_local');
      expect(onResolved).toHaveBeenCalled();
    });
  });
});