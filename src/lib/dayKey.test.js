import { describe, expect, it, vi } from 'vitest';
import { getLocalDayKey, getLocalTimezone } from './dayKey';

describe('day key utilities', () => {
  it('formats dates consistently across timezone boundaries', () => {
    const boundary = new Date('2026-01-01T01:30:00.000Z');

    expect(getLocalDayKey(boundary, 'America/Los_Angeles')).toBe('2025-12-31');
    expect(getLocalDayKey(boundary, 'Asia/Tokyo')).toBe('2026-01-01');
  });

  it('returns undefined when timezone detection fails', () => {
    const spy = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('Intl unavailable');
    });

    expect(getLocalTimezone()).toBeUndefined();
    spy.mockRestore();
  });
});
