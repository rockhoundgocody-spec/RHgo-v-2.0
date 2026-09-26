import { describe, it, expect } from 'vitest';
import { isValidCoordinatePair, parseCoordinates } from '../../base44/shared/geoValidation.ts';

describe('isValidCoordinatePair', () => {
  it('returns true for valid numeric coordinates within bounds', () => {
    expect(isValidCoordinatePair(45.5, -122.6)).toBe(true);
    expect(isValidCoordinatePair(0, 0)).toBe(true);
    expect(isValidCoordinatePair(-90, -180)).toBe(true);
    expect(isValidCoordinatePair(90, 180)).toBe(true);
    expect(isValidCoordinatePair('45.5', '-122.6')).toBe(true);
  });

  it('rejects out-of-bounds latitude and longitude values', () => {
    expect(isValidCoordinatePair(91, -122.6)).toBe(false);
    expect(isValidCoordinatePair(-90.1, -122.6)).toBe(false);
    expect(isValidCoordinatePair(45.5, 180.1)).toBe(false);
    expect(isValidCoordinatePair(45.5, -181)).toBe(false);
  });

  it('rejects non-numeric, non-finite, and special values', () => {
    expect(isValidCoordinatePair(NaN, -122.6)).toBe(false);
    expect(isValidCoordinatePair(45.5, Infinity)).toBe(false);
    expect(isValidCoordinatePair(-Infinity, -122.6)).toBe(false);
    expect(isValidCoordinatePair('invalid', -122.6)).toBe(false);
    expect(isValidCoordinatePair('45.5&admin=1', -122.6)).toBe(false);
  });

  it('rejects null, undefined, boolean, symbol, and object values', () => {
    expect(isValidCoordinatePair(null, -122.6)).toBe(false);
    expect(isValidCoordinatePair(45.5, undefined)).toBe(false);
    expect(isValidCoordinatePair(true, -122.6)).toBe(false);
    expect(isValidCoordinatePair(45.5, false)).toBe(false);
    expect(isValidCoordinatePair({}, -122.6)).toBe(false);
    expect(isValidCoordinatePair([], -122.6)).toBe(false);
  });
});

describe('parseCoordinates', () => {
  it('parses valid coordinate inputs into finite numbers', () => {
    expect(parseCoordinates(45.5, -122.6)).toEqual({ lat: 45.5, lng: -122.6 });
    expect(parseCoordinates('45.5', '-122.6')).toEqual({ lat: 45.5, lng: -122.6 });
  });

  it('returns null for invalid coordinate inputs', () => {
    expect(parseCoordinates(null, -122.6)).toBeNull();
    expect(parseCoordinates('invalid', -122.6)).toBeNull();
    expect(parseCoordinates(95, -122.6)).toBeNull();
  });
});
