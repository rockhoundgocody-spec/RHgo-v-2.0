import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockSetCopied = vi.fn();
let mockCopiedState = false;

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [mockCopiedState, mockSetCopied],
  };
});

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
  const sampleRareSpecimen = {
    id: 'spec-1',
    mineral_name: 'Amethyst',
    rarity: 'rare',
    found_at: 'Thunder Bay',
    found_date: '2026-03-15',
    image_url: 'https://example.com/amethyst.jpg',
  };

  const sampleCommonSpecimen = {
    id: 'spec-2',
    mineral_name: 'Quartz',
    rarity: 'common',
  };

  let originalNavigator;
  let originalWindowLocation;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCopiedState = false;

    originalNavigator = globalThis.navigator;
    originalWindowLocation = globalThis.window?.location;

    if (typeof globalThis.window === 'undefined') {
      globalThis.window = {
        location: { origin: 'http://localhost:3000' },
      };
    } else {
      Object.defineProperty(globalThis.window, 'location', {
        value: { origin: 'http://localhost:3000' },
        configurable: true,
        writable: true,
      });
    }
  });

  afterEach(() => {
    if (originalNavigator) {
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
    }
  });

  it('renders button with correct default styling, custom className, and accessibility attributes', () => {
    mockCopiedState = false;
    const tree = ShareSpecimenButton({ specimen: sampleRareSpecimen, className: 'custom-share-btn' });

    expect(tree).toBeDefined();
    expect(tree.type).toBe('button');
    expect(tree.props.type).toBe('button');
    expect(tree.props['aria-label']).toBe('Share specimen');
    expect(tree.props.className).toContain('custom-share-btn');
    expect(tree.props.className).toContain('focus-visible:ring-2');

    const [icon, span] = tree.props.children;
    expect(span.props.children).toBe('Share');
  });

  it('renders Copied state when copied is true', () => {
    mockCopiedState = true;
    const tree = ShareSpecimenButton({ specimen: sampleRareSpecimen });

    const [icon, span] = tree.props.children;
    expect(span.props.children).toBe('Copied');
  });

  it('uses Web Share API when navigator.share and canShare are supported and succeed', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockReturnValue(true);
    const mockWriteText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        share: mockShare,
        canShare: mockCanShare,
        clipboard: { writeText: mockWriteText },
      },
      configurable: true,
      writable: true,
    });

    const tree = ShareSpecimenButton({ specimen: sampleRareSpecimen });
    const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

    await tree.props.onClick(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();

    expect(base44.analytics.track).toHaveBeenCalledWith({
      eventName: 'specimen_shared',
      properties: { mineral: 'Amethyst', rarity: 'rare' },
    });

    const expectedText = 'Just found Amethyst (RARE) near Thunder Bay on 2026-03-15 🪨 Logged with RockHound-GO — the AI mineral companion app! 💎';
    const expectedShareData = {
      title: 'RockHound find: Amethyst',
      text: expectedText,
      url: 'https://example.com/amethyst.jpg',
    };

    expect(mockCanShare).toHaveBeenCalledWith(expectedShareData);
    expect(mockShare).toHaveBeenCalledWith(expectedShareData);
    expect(mockWriteText).not.toHaveBeenCalled();
  });

  it('falls back to clipboard when navigator.share rejects (e.g. user dismissed)', async () => {
    const mockShare = vi.fn().mockRejectedValue(new Error('User cancelled'));
    const mockCanShare = vi.fn().mockReturnValue(true);
    const mockWriteText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        share: mockShare,
        canShare: mockCanShare,
        clipboard: { writeText: mockWriteText },
      },
      configurable: true,
      writable: true,
    });

    const tree = ShareSpecimenButton({ specimen: sampleRareSpecimen });
    const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

    await tree.props.onClick(mockEvent);

    expect(mockShare).toHaveBeenCalled();
    const expectedText = 'Just found Amethyst (RARE) near Thunder Bay on 2026-03-15 🪨 Logged with RockHound-GO — the AI mineral companion app! 💎';
    expect(mockWriteText).toHaveBeenCalledWith(`${expectedText} https://example.com/amethyst.jpg`);
    expect(mockSetCopied).toHaveBeenCalledWith(true);
  });

  it('falls back to clipboard when navigator.share is absent and formats common specimen with origin URL', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        clipboard: { writeText: mockWriteText },
      },
      configurable: true,
      writable: true,
    });

    const tree = ShareSpecimenButton({ specimen: sampleCommonSpecimen });
    const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

    await tree.props.onClick(mockEvent);

    expect(base44.analytics.track).toHaveBeenCalledWith({
      eventName: 'specimen_shared',
      properties: { mineral: 'Quartz', rarity: 'common' },
    });

    const expectedText = 'Just found Quartz 🪨 Logged with RockHound-GO — the AI mineral companion app! 💎';
    expect(mockWriteText).toHaveBeenCalledWith(`${expectedText} http://localhost:3000`);
    expect(mockSetCopied).toHaveBeenCalledWith(true);
  });

  it('handles clipboard write failure gracefully without throwing', async () => {
    const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard error'));

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        clipboard: { writeText: mockWriteText },
      },
      configurable: true,
      writable: true,
    });

    const tree = ShareSpecimenButton({ specimen: sampleCommonSpecimen });
    const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

    await expect(tree.props.onClick(mockEvent)).resolves.not.toThrow();
    expect(mockSetCopied).not.toHaveBeenCalledWith(true);
  });
});
