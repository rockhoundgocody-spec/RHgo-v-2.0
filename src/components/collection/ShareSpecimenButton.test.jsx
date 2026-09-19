import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

const { MockShare2, MockCheck } = vi.hoisted(() => ({
  MockShare2: ({ size, ...props }) => <svg data-testid="icon-share2" data-size={size} {...props} />,
  MockCheck: ({ size, ...props }) => <svg data-testid="icon-check" data-size={size} {...props} />,
}));

let mockSetCopied = vi.fn();
let mockCopiedState = false;

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [mockCopiedState, mockSetCopied],
  };
});

vi.mock('lucide-react', () => ({
  Share2: MockShare2,
  Check: MockCheck,
}));

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
  let originalNavigator;
  let originalWindow;

  const sampleSpecimen = {
    mineral_name: 'Amethyst',
    rarity: 'rare',
    found_at: 'Thunder Bay',
    found_date: '2026-03-15',
    image_url: 'https://example.com/amethyst.jpg',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCopiedState = false;
    mockSetCopied = vi.fn();
    originalNavigator = globalThis.navigator;
    originalWindow = globalThis.window;

    globalThis.window = {
      location: {
        origin: 'https://rhgo.base44.app',
      },
    };
  });

  afterEach(() => {
    if (originalNavigator !== undefined) {
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
    } else {
      delete globalThis.navigator;
    }

    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      delete globalThis.window;
    }
  });

  const mockNavigatorAPI = (apiObj) => {
    Object.defineProperty(globalThis, 'navigator', {
      value: apiObj,
      writable: true,
      configurable: true,
    });
  };

  it('renders a button with correct accessibility attributes, icons, and text when not copied', () => {
    mockCopiedState = false;
    const button = ShareSpecimenButton({ specimen: sampleSpecimen, className: 'custom-class' });

    expect(button.type).toBe('button');
    expect(button.props['aria-label']).toBe('Share specimen');
    expect(button.props.className).toContain('custom-class');
    expect(button.props.className).toContain('bg-amethyst/10');

    const [icon, span] = button.props.children;
    expect(icon.type).toBe(MockShare2);
    expect(icon.props.size).toBe(12);
    expect(span.props.children).toBe('Share');
  });

  it('renders Check icon and "Copied" text when copied state is true', () => {
    mockCopiedState = true;
    const button = ShareSpecimenButton({ specimen: sampleSpecimen });

    const [icon, span] = button.props.children;
    expect(icon.type).toBe(MockCheck);
    expect(icon.props.size).toBe(12);
    expect(span.props.children).toBe('Copied');
  });

  it('prevents default and stops propagation on click', async () => {
    mockNavigatorAPI({});
    const button = ShareSpecimenButton({ specimen: sampleSpecimen });

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    await button.props.onClick(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it('tracks analytics event with specimen details on share click', async () => {
    mockNavigatorAPI({});
    const button = ShareSpecimenButton({ specimen: sampleSpecimen });

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    await button.props.onClick(mockEvent);

    expect(base44.analytics.track).toHaveBeenCalledWith({
      eventName: 'specimen_shared',
      properties: {
        mineral: 'Amethyst',
        rarity: 'rare',
      },
    });
  });

  it('defaults rarity in analytics to "common" if specimen rarity is missing', async () => {
    mockNavigatorAPI({});
    const specimenNoRarity = { mineral_name: 'Quartz' };
    const button = ShareSpecimenButton({ specimen: specimenNoRarity });

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    await button.props.onClick(mockEvent);

    expect(base44.analytics.track).toHaveBeenCalledWith({
      eventName: 'specimen_shared',
      properties: {
        mineral: 'Quartz',
        rarity: 'common',
      },
    });
  });

  it('uses navigator.share when available and canShare returns true', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    const canShareMock = vi.fn().mockReturnValue(true);
    const writeTextMock = vi.fn().mockResolvedValue(undefined);

    mockNavigatorAPI({
      share: shareMock,
      canShare: canShareMock,
      clipboard: { writeText: writeTextMock },
    });

    const button = ShareSpecimenButton({ specimen: sampleSpecimen });
    const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

    await button.props.onClick(mockEvent);

    const expectedText = 'Just found Amethyst (RARE) near Thunder Bay on 2026-03-15 🪨 Logged with RockHound-GO — the AI mineral companion app! 💎';
    const expectedShareData = {
      title: 'RockHound find: Amethyst',
      text: expectedText,
      url: 'https://example.com/amethyst.jpg',
    };

    expect(canShareMock).toHaveBeenCalledWith(expectedShareData);
    expect(shareMock).toHaveBeenCalledWith(expectedShareData);
    expect(writeTextMock).not.toHaveBeenCalled();
    expect(mockSetCopied).not.toHaveBeenCalled();
  });

  it('falls back to clipboard copy when navigator.share rejects (e.g. user dismissed)', async () => {
    vi.useFakeTimers();
    const shareMock = vi.fn().mockRejectedValue(new Error('User cancelled'));
    const canShareMock = vi.fn().mockReturnValue(true);
    const writeTextMock = vi.fn().mockResolvedValue(undefined);

    mockNavigatorAPI({
      share: shareMock,
      canShare: canShareMock,
      clipboard: { writeText: writeTextMock },
    });

    const button = ShareSpecimenButton({ specimen: sampleSpecimen });
    const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

    await button.props.onClick(mockEvent);

    const expectedText = 'Just found Amethyst (RARE) near Thunder Bay on 2026-03-15 🪨 Logged with RockHound-GO — the AI mineral companion app! 💎';
    const expectedUrl = 'https://example.com/amethyst.jpg';

    expect(shareMock).toHaveBeenCalled();
    expect(writeTextMock).toHaveBeenCalledWith(`${expectedText} ${expectedUrl}`);
    expect(mockSetCopied).toHaveBeenCalledWith(true);

    vi.runAllTimers();
    expect(mockSetCopied).toHaveBeenCalledWith(false);
    vi.useRealTimers();
  });

  it('falls back to clipboard copy when navigator.share is unavailable', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);

    mockNavigatorAPI({
      clipboard: { writeText: writeTextMock },
    });

    const button = ShareSpecimenButton({ specimen: sampleSpecimen });
    const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

    await button.props.onClick(mockEvent);

    const expectedText = 'Just found Amethyst (RARE) near Thunder Bay on 2026-03-15 🪨 Logged with RockHound-GO — the AI mineral companion app! 💎';
    expect(writeTextMock).toHaveBeenCalledWith(`${expectedText} https://example.com/amethyst.jpg`);
    expect(mockSetCopied).toHaveBeenCalledWith(true);
  });

  it('formats text correctly for common rarity, missing location, and missing image_url', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);

    mockNavigatorAPI({
      clipboard: { writeText: writeTextMock },
    });

    const commonSpecimen = {
      mineral_name: 'Calcite',
      rarity: 'common',
    };

    const button = ShareSpecimenButton({ specimen: commonSpecimen });
    const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

    await button.props.onClick(mockEvent);

    const expectedText = 'Just found Calcite 🪨 Logged with RockHound-GO — the AI mineral companion app! 💎';
    expect(writeTextMock).toHaveBeenCalledWith(`${expectedText} https://rhgo.base44.app`);
  });

  it('silently catches clipboard write failures without setting copied state', async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard blocked'));

    mockNavigatorAPI({
      clipboard: { writeText: writeTextMock },
    });

    const button = ShareSpecimenButton({ specimen: sampleSpecimen });
    const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

    await button.props.onClick(mockEvent);

    expect(writeTextMock).toHaveBeenCalled();
    expect(mockSetCopied).not.toHaveBeenCalled();
  });
});
