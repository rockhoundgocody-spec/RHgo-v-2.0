import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildSharePayload, executeShare, shareAchievement } from './shareAchievement';

describe('shareAchievement', () => {
  const APP_URL = 'https://rhgo.base44.app';

  describe('buildSharePayload', () => {
    it('returns default payload when called with empty options or undefined', () => {
      const payloadDefault = buildSharePayload();
      expect(payloadDefault).toEqual({
        title: 'RockHound-GO Challenge',
        text: `🪨 I'm a Rockhound on RockHound-GO with 0 XP! Can you beat my score?\n\nJoin me here:\n${APP_URL}`,
        url: APP_URL,
      });

      const payloadEmptyObj = buildSharePayload({});
      expect(payloadEmptyObj).toEqual(payloadDefault);
    });

    it('formats payload correctly with custom rank and xp', () => {
      const payload = buildSharePayload({ rank: 'Crystal Apprentice', xp: 1250 });
      expect(payload.title).toBe('RockHound-GO Challenge');
      expect(payload.url).toBe(APP_URL);
      expect(payload.text).toBe(
        `🪨 I'm a Crystal Apprentice on RockHound-GO with 1,250 XP! Can you beat my score?\n\nJoin me here:\n${APP_URL}`
      );
    });

    it('handles xp = 0 correctly without falling back to default improperly', () => {
      const payload = buildSharePayload({ rank: 'Prospector', xp: 0 });
      expect(payload.text).toBe(
        `🪨 I'm a Prospector on RockHound-GO with 0 XP! Can you beat my score?\n\nJoin me here:\n${APP_URL}`
      );
    });

    it('appends extra details line when extra option is provided', () => {
      const payload = buildSharePayload({
        rank: 'Master Finder',
        xp: 5000,
        extra: '15 finds · 4 badges',
      });
      expect(payload.text).toBe(
        `🪨 I'm a Master Finder on RockHound-GO with 5,000 XP! Can you beat my score?\n15 finds · 4 badges\n\nJoin me here:\n${APP_URL}`
      );
    });
  });

  describe('executeShare', () => {
    let originalNavigator;
    let originalDocument;

    beforeEach(() => {
      originalNavigator = globalThis.navigator;
      originalDocument = globalThis.document;
    });

    afterEach(() => {
      vi.restoreAllMocks();
      if (originalNavigator !== undefined) {
        Object.defineProperty(globalThis, 'navigator', {
          value: originalNavigator,
          writable: true,
          configurable: true,
        });
      } else {
        delete globalThis.navigator;
      }

      if (originalDocument !== undefined) {
        Object.defineProperty(globalThis, 'document', {
          value: originalDocument,
          writable: true,
          configurable: true,
        });
      } else {
        delete globalThis.document;
      }
    });

    const mockNavigator = (obj) => {
      Object.defineProperty(globalThis, 'navigator', {
        value: obj,
        writable: true,
        configurable: true,
      });
    };

    const mockDocument = (obj) => {
      Object.defineProperty(globalThis, 'document', {
        value: obj,
        writable: true,
        configurable: true,
      });
    };

    it('uses navigator.share when available and returns "native" on success', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      mockNavigator({ share: shareMock });

      const payload = { title: 'Title', text: 'Text', url: 'https://example.com' };
      const result = await executeShare(payload);

      expect(shareMock).toHaveBeenCalledWith({
        title: 'Title',
        text: 'Text',
        url: 'https://example.com',
      });
      expect(result).toBe('native');
    });

    it('returns "native" when navigator.share rejects with AbortError', async () => {
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';
      const shareMock = vi.fn().mockRejectedValue(abortError);
      mockNavigator({ share: shareMock });

      const payload = { title: 'Title', text: 'Text', url: 'https://example.com' };
      const result = await executeShare(payload);

      expect(result).toBe('native');
    });

    it('falls back to navigator.clipboard.writeText when navigator.share fails with non-AbortError', async () => {
      const shareMock = vi.fn().mockRejectedValue(new Error('Share failed'));
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      mockNavigator({
        share: shareMock,
        clipboard: { writeText: writeTextMock },
      });

      const payload = { title: 'Title', text: 'Text', url: 'https://example.com' };
      const result = await executeShare(payload);

      expect(writeTextMock).toHaveBeenCalledWith('Text');
      expect(result).toBe('clipboard');
    });

    it('uses navigator.clipboard.writeText when navigator.share is unsupported and returns "clipboard"', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      mockNavigator({
        clipboard: { writeText: writeTextMock },
      });

      const payload = { title: 'Title', text: 'Text', url: 'https://example.com' };
      const result = await executeShare(payload);

      expect(writeTextMock).toHaveBeenCalledWith('Text');
      expect(result).toBe('clipboard');
    });

    it('falls back to document.execCommand("copy") when navigator.clipboard is unavailable', async () => {
      mockNavigator({});

      const mockTextarea = {
        value: '',
        style: {},
        focus: vi.fn(),
        select: vi.fn(),
      };
      const appendChildMock = vi.fn();
      const removeChildMock = vi.fn();
      const execCommandMock = vi.fn().mockReturnValue(true);

      mockDocument({
        createElement: vi.fn().mockReturnValue(mockTextarea),
        body: {
          appendChild: appendChildMock,
          removeChild: removeChildMock,
        },
        execCommand: execCommandMock,
      });

      const payload = { title: 'Title', text: 'Text', url: 'https://example.com' };
      const result = await executeShare(payload);

      expect(globalThis.document.createElement).toHaveBeenCalledWith('textarea');
      expect(mockTextarea.value).toBe('Text');
      expect(appendChildMock).toHaveBeenCalledWith(mockTextarea);
      expect(mockTextarea.focus).toHaveBeenCalled();
      expect(mockTextarea.select).toHaveBeenCalled();
      expect(execCommandMock).toHaveBeenCalledWith('copy');
      expect(removeChildMock).toHaveBeenCalledWith(mockTextarea);
      expect(result).toBe('clipboard');
    });

    it('returns "error" when both navigator methods and execCommand fail', async () => {
      mockNavigator({
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error('Clipboard denied')),
        },
      });

      const payload = { title: 'Title', text: 'Text', url: 'https://example.com' };
      const result = await executeShare(payload);

      expect(result).toBe('error');
    });

    it('returns "error" when execCommand fallback throws an exception', async () => {
      mockNavigator({});
      mockDocument({
        createElement: vi.fn().mockImplementation(() => {
          throw new Error('DOM Error');
        }),
      });

      const payload = { title: 'Title', text: 'Text', url: 'https://example.com' };
      const result = await executeShare(payload);

      expect(result).toBe('error');
    });
  });

  describe('shareAchievement', () => {
    it('builds payload and executes share successfully', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(globalThis, 'navigator', {
        value: { share: shareMock },
        writable: true,
        configurable: true,
      });

      const result = await shareAchievement({ rank: 'Legend', xp: 99999 });

      expect(shareMock).toHaveBeenCalledWith({
        title: 'RockHound-GO Challenge',
        text: `🪨 I'm a Legend on RockHound-GO with 99,999 XP! Can you beat my score?\n\nJoin me here:\n${APP_URL}`,
        url: APP_URL,
      });
      expect(result).toBe('native');
    });
  });
});
