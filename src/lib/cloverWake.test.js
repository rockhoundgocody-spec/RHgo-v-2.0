// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  normalizeTranscript,
  levenshtein,
  matchesWakeWord,
  isWakeEnabled,
  setWakeEnabled,
  setCloverBusy,
  isCloverBusy,
  on,
  emit,
  emitWake,
  emitDenied,
} from './cloverWake';

describe('cloverWake', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset clover busy state
    setCloverBusy('test1', false);
    setCloverBusy('test2', false);
  });

  describe('normalizeTranscript', () => {
    it('returns empty string for empty, null, or undefined inputs', () => {
      expect(normalizeTranscript('')).toBe('');
      expect(normalizeTranscript(null)).toBe('');
      expect(normalizeTranscript(undefined)).toBe('');
    });

    it('lowercases text, strips non-alphabetical punctuation, and normalizes spaces', () => {
      expect(normalizeTranscript('  Hey, Clover!  How are you?  ')).toBe('hey clover how are you');
      expect(normalizeTranscript('clover#123--test')).toBe('clover test');
    });
  });

  describe('levenshtein', () => {
    it('returns 0 when both strings are identical', () => {
      expect(levenshtein('clover', 'clover')).toBe(0);
      expect(levenshtein('', '')).toBe(0);
    });

    it('calculates single-character insertions, deletions, and substitutions correctly', () => {
      expect(levenshtein('clover', 'clovr')).toBe(1); // deletion
      expect(levenshtein('clover', 'cloverr')).toBe(1); // insertion
      expect(levenshtein('clover', 'clever')).toBe(1); // substitution
    });

    it('calculates multi-character edit distances correctly', () => {
      expect(levenshtein('clover', 'klovr')).toBe(2);
      expect(levenshtein('kitten', 'sitting')).toBe(3);
    });

    it('handles empty string comparisons correctly', () => {
      expect(levenshtein('', 'clover')).toBe(6);
      expect(levenshtein('clover', '')).toBe(6);
    });
  });

  describe('matchesWakeWord', () => {
    it('returns false for empty or non-matching text', () => {
      expect(matchesWakeWord('')).toBe(false);
      expect(matchesWakeWord('   ')).toBe(false);
      expect(matchesWakeWord('hello world')).toBe(false);
      expect(matchesWakeWord('find some quartz')).toBe(false);
    });

    it('matches exact trigger phrases', () => {
      expect(matchesWakeWord('hey clover')).toBe(true);
      expect(matchesWakeWord('hi clover, check this out')).toBe(true);
      expect(matchesWakeWord('yo clover')).toBe(true);
      expect(matchesWakeWord('ok clover search')).toBe(true);
      expect(matchesWakeWord('okay clover')).toBe(true);
      expect(matchesWakeWord('hello clover')).toBe(true);
      expect(matchesWakeWord('hey clo')).toBe(true);
    });

    it('matches phonetic variants via regex', () => {
      expect(matchesWakeWord('clever')).toBe(true);
      expect(matchesWakeWord('glover')).toBe(true);
      expect(matchesWakeWord('klovr')).toBe(true);
      expect(matchesWakeWord('claver')).toBe(true);
    });

    it('matches fuzzy single words via Levenshtein distance', () => {
      expect(matchesWakeWord('clovr')).toBe(true);
      expect(matchesWakeWord('cloverr')).toBe(true);
    });

    it('matches fuzzy phrase pairs via Levenshtein distance', () => {
      expect(matchesWakeWord('hey clovr')).toBe(true);
    });

    it('matches split recognitions like "clo ver" or "clove er"', () => {
      expect(matchesWakeWord('clo ver')).toBe(true);
      expect(matchesWakeWord('clove er')).toBe(true);
    });
  });

  describe('isWakeEnabled & setWakeEnabled', () => {
    it('defaults to false when localStorage is empty', () => {
      expect(isWakeEnabled()).toBe(false);
    });

    it('sets and gets enabled state via localStorage and emits event', () => {
      const listener = vi.fn();
      const unsub = on('enabled', listener);

      setWakeEnabled(true);
      expect(isWakeEnabled()).toBe(true);
      expect(localStorage.getItem('clover_wake_word')).toBe('1');
      expect(listener).toHaveBeenCalledWith(true);

      setWakeEnabled(false);
      expect(isWakeEnabled()).toBe(false);
      expect(localStorage.getItem('clover_wake_word')).toBe('0');
      expect(listener).toHaveBeenCalledWith(false);

      unsub();
    });

    it('gracefully handles localStorage throwing errors', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage disabled');
      });
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage disabled');
      });

      expect(isWakeEnabled()).toBe(false);
      expect(() => setWakeEnabled(true)).not.toThrow();

      getItemSpy.mockRestore();
      setItemSpy.mockRestore();
    });
  });

  describe('busy state tracking', () => {
    it('tracks busy state accurately across multiple source IDs', () => {
      const busyListener = vi.fn();
      const unsub = on('busy', busyListener);

      expect(isCloverBusy()).toBe(false);

      setCloverBusy('voice', true);
      expect(isCloverBusy()).toBe(true);
      expect(busyListener).toHaveBeenCalledTimes(1);
      expect(busyListener).toHaveBeenCalledWith(true);

      // Adding another busy source should keep busy true, but not re-emit state change
      setCloverBusy('audio', true);
      expect(isCloverBusy()).toBe(true);
      expect(busyListener).toHaveBeenCalledTimes(1);

      // Releasing one source keeps it busy
      setCloverBusy('voice', false);
      expect(isCloverBusy()).toBe(true);
      expect(busyListener).toHaveBeenCalledTimes(1);

      // Releasing all sources emits busy = false
      setCloverBusy('audio', false);
      expect(isCloverBusy()).toBe(false);
      expect(busyListener).toHaveBeenCalledTimes(2);
      expect(busyListener).toHaveBeenLastCalledWith(false);

      unsub();
    });
  });

  describe('event bus & helpers', () => {
    it('allows subscribing, emitting, and unsubscribing', () => {
      const listener = vi.fn();
      const unsub = on('custom_event', listener);

      emit('custom_event', { data: 123 });
      expect(listener).toHaveBeenCalledWith({ data: 123 });

      unsub();
      emit('custom_event', { data: 456 });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('handles listener throwing errors without breaking other listeners', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const badListener = () => {
        throw new Error('Failure in listener');
      };
      const goodListener = vi.fn();

      on('test_err', badListener);
      on('test_err', goodListener);

      expect(() => emit('test_err', 'payload')).not.toThrow();
      expect(goodListener).toHaveBeenCalledWith('payload');
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('emits wake and denied events via helper functions', () => {
      const wakeListener = vi.fn();
      const deniedListener = vi.fn();

      on('wake', wakeListener);
      on('denied', deniedListener);

      emitWake();
      expect(wakeListener).toHaveBeenCalledTimes(1);

      emitDenied();
      expect(deniedListener).toHaveBeenCalledTimes(1);
    });
  });
});
