import { describe, expect, it } from 'vitest';
import { getPinnedSpecimens } from './mapSpecimens';

describe('getPinnedSpecimens', () => {
  it('preserves valid equator and prime-meridian coordinates', () => {
    const specimens = [
      { id: 'equator', lat: 0, lng: -78.4 },
      { id: 'prime', lat: 51.5, lng: 0 },
    ];
    expect(getPinnedSpecimens(specimens)).toEqual(specimens);
  });

  it('rejects missing, non-numeric, and out-of-range locations', () => {
    expect(getPinnedSpecimens([
      { id: 'missing', lat: null, lng: 10 },
      { id: 'string', lat: '45', lng: -90 },
      { id: 'latitude', lat: 91, lng: 10 },
      { id: 'longitude', lat: 45, lng: -181 },
    ])).toEqual([]);
  });
});
