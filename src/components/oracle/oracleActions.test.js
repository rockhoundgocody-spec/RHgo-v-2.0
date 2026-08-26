import { describe, expect, it, vi } from 'vitest';
import { detectLogIntent, getCurrentCoordinates } from './oracleActions';

describe('Oracle actions', () => {
  it('detects explicit logging requests without matching normal mineral questions', () => {
    expect(detectLogIntent('Please log this quartz specimen')).toBe(true);
    expect(detectLogIntent('save my new rock find')).toBe(true);
    expect(detectLogIntent('How hard is quartz?')).toBe(false);
  });

  it('returns coordinates with privacy-conscious timeout and cache limits', async () => {
    const getCurrentPosition = vi.fn((onSuccess, _onError, options) => {
      expect(options).toEqual({ timeout: 4000, maximumAge: 60000 });
      onSuccess({ coords: { latitude: 44.98, longitude: -93.27 } });
    });

    await expect(getCurrentCoordinates({ getCurrentPosition })).resolves.toEqual({
      lat: 44.98,
      lng: -93.27,
    });
  });

  it('continues without coordinates when geolocation is unavailable or denied', async () => {
    await expect(getCurrentCoordinates(undefined)).resolves.toEqual({});
    await expect(getCurrentCoordinates({
      getCurrentPosition: (_success, error) => error(new Error('denied')),
    })).resolves.toEqual({});
  });
});
