import { assertEquals, assertThrows } from 'jsr:@std/assert';
import {
  buildLocationSubmission,
  getStoredLocation,
  hasValidPrivateLocation,
} from './locationSubmission.ts';

Deno.test('location submissions require a complete bounded coordinate pair', () => {
  assertEquals(hasValidPrivateLocation({ id: 'one', lat: 44.9, lng: -85.2 }), true);
  assertEquals(hasValidPrivateLocation({ id: 'one', lat: 44.9, lng: null }), false);
  assertEquals(hasValidPrivateLocation({ id: 'one', lat: 91, lng: -85.2 }), false);
  assertEquals(hasValidPrivateLocation({ id: 'one', lat: 44.9, lng: Number.NaN }), false);
});

Deno.test('location submission metadata never includes coordinates', () => {
  const submission = buildLocationSubmission(
    { id: 'specimen-1', mineral_name: 'Agate', lat: 44.9, lng: -85.2 },
    'owner@example.com',
    new Date('2026-08-26T12:00:00.000Z'),
  );

  assertEquals(submission, {
    specimen_id: 'specimen-1',
    mineral_name: 'Agate',
    owner_email: 'owner@example.com',
    status: 'pending',
    submission_type: 'user_find',
    requested_at: '2026-08-26T12:00:00.000Z',
  });
  assertEquals('lat' in submission, false);
  assertEquals('lng' in submission, false);
});

Deno.test('server-side privacy fails closed and rounds approximate coordinates', () => {
  assertEquals(getStoredLocation(44.91234, -85.21234, 'private'), {
    geoPrivacy: 'private',
    lat: null,
    lng: null,
  });
  assertEquals(getStoredLocation(44.91234, -85.21234, 'approximate'), {
    geoPrivacy: 'approximate',
    lat: 44.91,
    lng: -85.21,
  });
  assertEquals(getStoredLocation(44.91234, -85.21234, 'unexpected'), {
    geoPrivacy: 'private',
    lat: null,
    lng: null,
  });
  assertEquals(getStoredLocation(44.91234, null, 'exact'), {
    geoPrivacy: 'exact',
    lat: null,
    lng: null,
  });
});

Deno.test('location submission rejects records without private location evidence', () => {
  assertThrows(
    () => buildLocationSubmission({ id: 'specimen-1' }, 'owner@example.com'),
    Error,
    'private specimen location',
  );
});

Deno.test('user location paths cannot write publicly readable hotspots', async () => {
  const identifySource = await Deno.readTextFile(
    new URL('../functions/identifySpecimen/entry.ts', import.meta.url),
  );
  const quickPinSource = await Deno.readTextFile(
    new URL('../../src/components/explore/QuickPinButton.jsx', import.meta.url),
  );

  assertEquals(/entities\.Hotspot\.(create|update)/.test(identifySource), false);
  assertEquals(quickPinSource.includes("entity: 'Hotspot'"), false);
  assertEquals(quickPinSource.includes("entity: 'PrivateRockLog'"), true);
});
