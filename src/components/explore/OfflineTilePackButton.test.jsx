import { describe, it, expect, vi } from 'vitest';

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
  };
});

vi.mock('@/lib/useOfflineTiles', () => ({
  default: vi.fn(() => ({
    prefetch: vi.fn(),
    clear: vi.fn(),
    status: 'idle',
    progress: 0,
    tileCount: 0,
  })),
}));

import OfflineTilePackButton from './OfflineTilePackButton';
import useOfflineTiles from '@/lib/useOfflineTiles';

describe('OfflineTilePackButton', () => {
  it('returns null when userLocation is missing', () => {
    const result = OfflineTilePackButton({ userLocation: null });
    expect(result).toBeNull();
  });

  it('renders initial button with aria-label when idle', () => {
    const result = OfflineTilePackButton({ userLocation: { lat: 40, lng: -105 } });
    expect(result).not.toBeNull();
    expect(result.props['aria-label']).toBe('Offline map tile pack');
  });

  it('renders done status button with aria-label when status is done', () => {
    vi.mocked(useOfflineTiles).mockReturnValue({
      prefetch: vi.fn(),
      clear: vi.fn(),
      status: 'done',
      progress: 100,
      tileCount: 50,
    });

    const result = OfflineTilePackButton({ userLocation: { lat: 40, lng: -105 } });
    expect(result.props['aria-label']).toBe('Clear cached map tiles');
  });

  it('renders fetching status div with role status and aria-live when status is fetching', () => {
    vi.mocked(useOfflineTiles).mockReturnValue({
      prefetch: vi.fn(),
      clear: vi.fn(),
      status: 'fetching',
      progress: 45,
      tileCount: 100,
    });

    const result = OfflineTilePackButton({ userLocation: { lat: 40, lng: -105 } });
    expect(result.props.role).toBe('status');
    expect(result.props['aria-live']).toBe('polite');
  });
});
