import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildSharePayload, executeShare, shareAchievement } from './shareAchievement';

describe('buildSharePayload', () => {
  it('should build the standard payload with default values', () => {
    const payload = buildSharePayload();
    expect(payload.title).toBe('RockHound-GO Challenge');
    expect(payload.url).toBe('https://rhgo.base44.app');
    expect(payload.text).toContain('Rockhound');
    expect(payload.text).toContain('0 XP');
  });

  it('should format payload with specific rank, xp, and extra text', () => {
    const payload = buildSharePayload({
      rank: 'Amethyst Master',
      xp: 12500,
      extra: 'Earned Amethyst Badge!'
    });
    expect(payload.text).toContain('Amethyst Master');
    expect(payload.text).toContain('12,500 XP');
    expect(payload.text).toContain('Earned Amethyst Badge!');
  });
});

describe('executeShare', () => {
  let originalNavigator;
  let originalDocument;

  beforeEach(() => {
    originalNavigator = globalThis.navigator;
    originalDocument = globalThis.document;

    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, 'document', {
      value: {
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        },
        createElement: vi.fn(),
        execCommand: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'document', {
      value: originalDocument,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('should use navigator.share if available and successful', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    globalThis.navigator.share = shareMock;

    const payload = { title: 'Test Title', text: 'Test Text', url: 'https://test.com' };
    const result = await executeShare(payload);

    expect(result).toBe('native');
    expect(shareMock).toHaveBeenCalledWith({
      title: 'Test Title',
      text: 'Test Text',
      url: 'https://test.com'
    });
  });

  it('should handle navigator.share AbortError as successful native share', async () => {
    const abortError = new Error('Share dismissed');
    abortError.name = 'AbortError';
    const shareMock = vi.fn().mockRejectedValue(abortError);
    globalThis.navigator.share = shareMock;

    const payload = { title: 'Test Title', text: 'Test Text', url: 'https://test.com' };
    const result = await executeShare(payload);

    expect(result).toBe('native');
    expect(shareMock).toHaveBeenCalled();
  });

  it('should fall back to navigator.clipboard if navigator.share fails with a non-AbortError', async () => {
    const error = new Error('Generic sharing error');
    const shareMock = vi.fn().mockRejectedValue(error);
    globalThis.navigator.share = shareMock;

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    globalThis.navigator.clipboard = { writeText: writeTextMock };

    const payload = { title: 'Test Title', text: 'Test Text', url: 'https://test.com' };
    const result = await executeShare(payload);

    expect(result).toBe('clipboard');
    expect(shareMock).toHaveBeenCalled();
    expect(writeTextMock).toHaveBeenCalledWith('Test Text');
  });

  it('should use navigator.clipboard if navigator.share is not supported', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    globalThis.navigator.clipboard = { writeText: writeTextMock };

    const payload = { title: 'Test Title', text: 'Test Text', url: 'https://test.com' };
    const result = await executeShare(payload);

    expect(result).toBe('clipboard');
    expect(writeTextMock).toHaveBeenCalledWith('Test Text');
  });

  it('should fall back to document.execCommand if navigator.clipboard is not supported', async () => {
    const mockTextArea = {
      value: '',
      style: {},
      focus: vi.fn(),
      select: vi.fn(),
    };
    globalThis.document.createElement.mockReturnValue(mockTextArea);

    const payload = { title: 'Test Title', text: 'Test Text', url: 'https://test.com' };
    const result = await executeShare(payload);

    expect(result).toBe('clipboard');
    expect(globalThis.document.createElement).toHaveBeenCalledWith('textarea');
    expect(mockTextArea.value).toBe('Test Text');
    expect(globalThis.document.body.appendChild).toHaveBeenCalledWith(mockTextArea);
    expect(mockTextArea.focus).toHaveBeenCalled();
    expect(mockTextArea.select).toHaveBeenCalled();
    expect(globalThis.document.execCommand).toHaveBeenCalledWith('copy');
    expect(globalThis.document.body.removeChild).toHaveBeenCalledWith(mockTextArea);
  });

  it('should return error if both clipboard and legacy copy methods throw an error', async () => {
    globalThis.navigator.clipboard = {
      writeText: vi.fn().mockRejectedValue(new Error('Clipboard block')),
    };

    globalThis.document.createElement.mockImplementation(() => {
      throw new Error('DOM error');
    });

    const payload = { title: 'Test Title', text: 'Test Text', url: 'https://test.com' };
    const result = await executeShare(payload);

    expect(result).toBe('error');
  });
});

describe('shareAchievement', () => {
  it('should build and execute share', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    globalThis.navigator.clipboard = { writeText: writeTextMock };

    const result = await shareAchievement({
      rank: 'Diamond Expert',
      xp: 5000,
    });

    expect(result).toBe('clipboard');
    expect(writeTextMock).toHaveBeenCalled();
  });
});
