import { describe, expect, it } from 'vitest';
import { buildPrivatePinRecord } from './privateLocation';

describe('buildPrivatePinRecord', () => {
  it('builds an owner-scoped private log record', () => {
    const record = buildPrivatePinRecord(
      { lat: 44.9, lng: -85.2 },
      'owner@example.com',
      new Date('2026-08-26T12:00:00.000Z'),
    );

    expect(record).toMatchObject({
      owner_email: 'owner@example.com',
      mineral_name: 'Field Pin',
      lat: 44.9,
      lng: -85.2,
      found_date: '2026-08-26',
    });
  });

  it.each([
    [null],
    [{ lat: 44.9 }],
    [{ lat: 91, lng: -85.2 }],
    [{ lat: 44.9, lng: Number.NaN }],
  ])('rejects invalid or partial coordinates: %o', (location) => {
    expect(() => buildPrivatePinRecord(location, 'owner@example.com')).toThrow('valid GPS location');
  });

  it('requires an authenticated owner', () => {
    expect(() => buildPrivatePinRecord({ lat: 44.9, lng: -85.2 }, '')).toThrow('authenticated owner');
  });
});
