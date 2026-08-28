import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
  };
});

vi.mock('@/api/base44Client', () => ({
  base44: {
    analytics: {
      track: vi.fn(),
    },
  },
}));

import ShareSpecimenButton from './ShareSpecimenButton';

describe('ShareSpecimenButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof globalThis.window === 'undefined') {
      globalThis.window = { location: { origin: 'http://localhost' } };
    }
  });

  it('renders correctly with aria-label, focus-visible classes, and status container', () => {
    const specimen = {
      mineral_name: 'Amethyst',
      rarity: 'rare',
      found_at: 'Lake Superior',
      found_date: '2025-05-10',
    };

    const element = ShareSpecimenButton({ specimen });

    expect(element.type).toBe('button');
    expect(element.props['aria-label']).toBe('Share specimen');
    expect(element.props.className).toContain('focus-visible:ring-2');

    const children = element.props.children;
    const labelSpan = children[1];
    expect(labelSpan.props.role).toBe('status');
    expect(labelSpan.props['aria-live']).toBe('polite');
    expect(labelSpan.props.children).toBe('Share');
  });

  it('copies specimen text to clipboard and updates live status on click when share API unavailable', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
      share: undefined,
    });

    const specimen = {
      mineral_name: 'Agate',
      rarity: 'common',
      image_url: 'https://example.com/agate.jpg',
    };

    const element = ShareSpecimenButton({ specimen });

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    await element.props.onClick(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(writeTextMock).toHaveBeenCalled();
    expect(writeTextMock.mock.calls[0][0]).toContain('Just found Agate');
  });
});
