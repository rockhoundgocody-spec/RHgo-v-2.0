import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildSharePayload, executeShare, shareAchievement } from './shareAchievement.js';

describe('shareAchievement', () => {
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
        configurable: true,
        writable: true,
      });
    } else {
      delete globalThis.navigator;
    }
  });

  describe('buildSharePayload', () => {
    it('builds payload with default options', () => {
      const payload = buildSharePayload();
      expect(payload.title).toBe('RockHound-GO Challenge');
      expect(payload.url).toBe('https://rhgo.base44.app');
      expect(payload.text).toContain("I'm a Rockhound on RockHound-GO with 0 XP!");
      expect(payload.text).toContain('https://rhgo.base44.app');
      expect(payload.text).not.toContain('\n\n\n');
    });

    it('builds payload with custom options including rank, xp, and extra context', () => {
      const payload = buildSharePayload({
        rank: 'Crystal Apprentice',
        xp: 1250,
        extra: '🏆 Found Quartz Crystal Badge',
      });
      expect(payload.title).toBe('RockHound-GO Challenge');
      expect(payload.url).toBe('https://rhgo.base44.app');
      expect(payload.text).toContain("I'm a Crystal Apprentice on RockHound-GO with 1,250 XP!");
      expect(payload.text).toContain('🏆 Found Quartz Crystal Badge');
      expect(payload.text).toContain('Join me here:\nhttps://rhgo.base44.app');
    });
  });

  describe('executeShare', () => {
    const samplePayload = {
      title: 'RockHound-GO Challenge',
      text: '🪨 Check out my rock hunting progress!',
      url: 'https://rhgo.base44.app',
    };

    it('returns "native" when navigator.share succeeds', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(globalThis, 'navigator', {
        value: { share: shareMock },
        configurable: true,
        writable: true,
      });

      const result = await executeShare(samplePayload);

      expect(shareMock).toHaveBeenCalledWith({
        title: samplePayload.title,
        text: samplePayload.text,
        url: samplePayload.url,
      });
      expect(result).toBe('native');
    });

    it('returns "native" when navigator.share throws AbortError (user cancelled)', async () => {
      const abortErr = new Error('User cancelled share');
      abortErr.name = 'AbortError';
      const shareMock = vi.fn().mockRejectedValue(abortErr);

      Object.defineProperty(globalThis, 'navigator', {
        value: { share: shareMock },
        configurable: true,
        writable: true,
      });

      const result = await executeShare(samplePayload);

      expect(shareMock).toHaveBeenCalled();
      expect(result).toBe('native');
    });

    it('falls back to navigator.clipboard.writeText when navigator.share fails with non-AbortError', async () => {
      const shareErr = new Error('Share rejected');
      shareErr.name = 'NotAllowedError';
      const shareMock = vi.fn().mockRejectedValue(shareErr);
      const writeTextMock = vi.fn().mockResolvedValue(undefined);

      Object.defineProperty(globalThis, 'navigator', {
        value: {
          share: shareMock,
          clipboard: { writeText: writeTextMock },
        },
        configurable: true,
        writable: true,
      });

      const result = await executeShare(samplePayload);

      expect(shareMock).toHaveBeenCalled();
      expect(writeTextMock).toHaveBeenCalledWith(samplePayload.text);
      expect(result).toBe('clipboard');
    });

    it('falls back to navigator.clipboard.writeText when navigator.share is unavailable', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);

      Object.defineProperty(globalThis, 'navigator', {
        value: {
          clipboard: { writeText: writeTextMock },
        },
        configurable: true,
        writable: true,
      });

      const result = await executeShare(samplePayload);

      expect(writeTextMock).toHaveBeenCalledWith(samplePayload.text);
      expect(result).toBe('clipboard');
    });

    it('falls back to document.execCommand when navigator.share and navigator.clipboard are unavailable', async () => {
      const focusMock = vi.fn();
      const selectMock = vi.fn();
      const mockTextarea = {
        value: '',
        style: {},
        focus: focusMock,
        select: selectMock,
      };

      const createElementMock = vi.fn().mockReturnValue(mockTextarea);
      const appendChildMock = vi.fn();
      const removeChildMock = vi.fn();
      const execCommandMock = vi.fn().mockReturnValue(true);

      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        configurable: true,
        writable: true,
      });

      const originalDoc = globalThis.document;
      Object.defineProperty(globalThis, 'document', {
        value: {
          createElement: createElementMock,
          body: {
            appendChild: appendChildMock,
            removeChild: removeChildMock,
          },
          execCommand: execCommandMock,
        },
        configurable: true,
        writable: true,
      });

      try {
        const result = await executeShare(samplePayload);

        expect(createElementMock).toHaveBeenCalledWith('textarea');
        expect(mockTextarea.value).toBe(samplePayload.text);
        expect(appendChildMock).toHaveBeenCalledWith(mockTextarea);
        expect(focusMock).toHaveBeenCalled();
        expect(selectMock).toHaveBeenCalled();
        expect(execCommandMock).toHaveBeenCalledWith('copy');
        expect(removeChildMock).toHaveBeenCalledWith(mockTextarea);
        expect(result).toBe('clipboard');
      } finally {
        Object.defineProperty(globalThis, 'document', {
          value: originalDoc,
          configurable: true,
          writable: true,
        });
      }
    });

    it('returns "error" when navigator.share fails and clipboard fallback throws error', async () => {
      const shareErr = new Error('Share error');
      const shareMock = vi.fn().mockRejectedValue(shareErr);
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard error'));

      Object.defineProperty(globalThis, 'navigator', {
        value: {
          share: shareMock,
          clipboard: { writeText: writeTextMock },
        },
        configurable: true,
        writable: true,
      });

      const result = await executeShare(samplePayload);

      expect(shareMock).toHaveBeenCalled();
      expect(writeTextMock).toHaveBeenCalledWith(samplePayload.text);
      expect(result).toBe('error');
    });
  });

  describe('shareAchievement', () => {
    it('builds payload and executes share', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);

      Object.defineProperty(globalThis, 'navigator', {
        value: {
          clipboard: { writeText: writeTextMock },
        },
        configurable: true,
        writable: true,
      });

      const result = await shareAchievement({
        rank: 'Geode Master',
        xp: 5000,
      });

      expect(writeTextMock).toHaveBeenCalled();
      const copiedText = writeTextMock.mock.calls[0][0];
      expect(copiedText).toContain('Geode Master');
      expect(copiedText).toContain('5,000 XP');
      expect(result).toBe('clipboard');
    });
  });
});
