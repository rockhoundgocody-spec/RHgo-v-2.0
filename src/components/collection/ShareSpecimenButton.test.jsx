import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import React from 'react';

// Mock react module so function component can be invoked directly
const setCopiedMock = vi.fn();
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, setCopiedMock],
  };
});

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Share2: ({ size }) => <svg data-testid="icon-share" data-size={size} />,
  Check: ({ size }) => <svg data-testid="icon-check" data-size={size} />,
}));

// Mock base44Client
vi.mock('@/api/base44Client', () => ({
  base44: {
    analytics: {
      track: vi.fn(),
    },
  },
}));

import { base44 } from '@/api/base44Client';
import ShareSpecimenButton from './ShareSpecimenButton.jsx';

describe('ShareSpecimenButton', () => {
  const originalNavigator = globalThis.navigator;

  beforeAll(() => {
    globalThis.window = globalThis.window || {};
    if (!globalThis.window.location) {
      globalThis.window.location = { origin: 'https://rockhound.app' };
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it('renders correctly with default props and initial state', () => {
    const mockSpecimen = { mineral_name: 'Quartz', rarity: 'common' };
    const element = ShareSpecimenButton({ specimen: mockSpecimen, className: 'my-custom-class' });

    expect(element.type).toBe('button');
    expect(element.props.type).toBe('button');
    expect(element.props['aria-label']).toBe('Share specimen');
    expect(element.props.className).toContain('my-custom-class');

    const [icon, labelSpan] = element.props.children;
    expect(icon).toBeDefined();
    expect(labelSpan.props.children).toBe('Share');
  });

  it('triggers analytics and calls navigator.share when available and supported', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockReturnValue(true);

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        share: mockShare,
        canShare: mockCanShare,
      },
      writable: true,
      configurable: true,
    });

    const mockSpecimen = {
      mineral_name: 'Amethyst',
      rarity: 'rare',
      found_at: 'Thunder Bay',
      found_date: '2026-03-15',
      image_url: 'https://example.com/amethyst.jpg',
    };

    const element = ShareSpecimenButton({ specimen: mockSpecimen });
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    await element.props.onClick(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();

    expect(base44.analytics.track).toHaveBeenCalledWith({
      eventName: 'specimen_shared',
      properties: { mineral: 'Amethyst', rarity: 'rare' },
    });

    expect(mockCanShare).toHaveBeenCalled();
    expect(mockShare).toHaveBeenCalledWith({
      title: 'RockHound find: Amethyst',
      text: 'Just found Amethyst (RARE) near Thunder Bay on 2026-03-15 🪨 Logged with RockHound-GO — the AI mineral companion app! 💎',
      url: 'https://example.com/amethyst.jpg',
    });
  });

  it('falls back to window.location.origin when image_url is missing and default rarity to common in analytics', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockReturnValue(true);

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        share: mockShare,
        canShare: mockCanShare,
      },
      writable: true,
      configurable: true,
    });

    const mockSpecimen = {
      mineral_name: 'Calcite',
    };

    const element = ShareSpecimenButton({ specimen: mockSpecimen });
    const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

    await element.props.onClick(mockEvent);

    expect(base44.analytics.track).toHaveBeenCalledWith({
      eventName: 'specimen_shared',
      properties: { mineral: 'Calcite', rarity: 'common' },
    });

    expect(mockShare).toHaveBeenCalledWith({
      title: 'RockHound find: Calcite',
      text: 'Just found Calcite 🪨 Logged with RockHound-GO — the AI mineral companion app! 💎',
      url: window.location.origin,
    });
  });

  it('falls back to clipboard copy when navigator.share is rejected or dismissed', async () => {
    const mockShare = vi.fn().mockRejectedValue(new Error('User dismissed share'));
    const mockCanShare = vi.fn().mockReturnValue(true);
    const mockWriteText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        share: mockShare,
        canShare: mockCanShare,
        clipboard: {
          writeText: mockWriteText,
        },
      },
      writable: true,
      configurable: true,
    });

    const mockSpecimen = {
      mineral_name: 'Pyrite',
      rarity: 'uncommon',
      image_url: 'https://example.com/pyrite.jpg',
    };

    const element = ShareSpecimenButton({ specimen: mockSpecimen });
    const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

    await element.props.onClick(mockEvent);

    expect(mockShare).toHaveBeenCalled();
    expect(mockWriteText).toHaveBeenCalledWith(
      'Just found Pyrite (UNCOMMON) 🪨 Logged with RockHound-GO — the AI mineral companion app! 💎 https://example.com/pyrite.jpg'
    );
    expect(setCopiedMock).toHaveBeenCalledWith(true);

    // Fast-forward 1800ms to test timeout resetting copied state
    vi.advanceTimersByTime(1800);
    expect(setCopiedMock).toHaveBeenCalledWith(false);
  });

  it('copies to clipboard directly when navigator.share is undefined', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        clipboard: {
          writeText: mockWriteText,
        },
      },
      writable: true,
      configurable: true,
    });

    const mockSpecimen = {
      mineral_name: 'Fluorite',
      rarity: 'rare',
    };

    const element = ShareSpecimenButton({ specimen: mockSpecimen });
    const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

    await element.props.onClick(mockEvent);

    expect(mockWriteText).toHaveBeenCalledWith(
      `Just found Fluorite (RARE) 🪨 Logged with RockHound-GO — the AI mineral companion app! 💎 ${window.location.origin}`
    );
    expect(setCopiedMock).toHaveBeenCalledWith(true);
  });

  it('handles clipboard write error silently without throwing', async () => {
    const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard permission denied'));

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        clipboard: {
          writeText: mockWriteText,
        },
      },
      writable: true,
      configurable: true,
    });

    const mockSpecimen = { mineral_name: 'Garnet' };
    const element = ShareSpecimenButton({ specimen: mockSpecimen });
    const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

    await expect(element.props.onClick(mockEvent)).resolves.not.toThrow();
    expect(mockWriteText).toHaveBeenCalled();
  });
});
