import { assertEquals } from 'jsr:@std/assert@1';
import { getDayKeyForTimezone, resolveDayKey } from './dayKey.ts';

const boundary = new Date('2026-01-01T01:30:00.000Z');

Deno.test('getDayKeyForTimezone returns an explicit ISO-like local date', () => {
  assertEquals(getDayKeyForTimezone('America/Los_Angeles', boundary), '2025-12-31');
  assertEquals(getDayKeyForTimezone('Asia/Tokyo', boundary), '2026-01-01');
});

Deno.test('resolveDayKey falls back to UTC for missing or invalid timezones', () => {
  assertEquals(resolveDayKey(undefined, boundary), '2026-01-01');
  assertEquals(resolveDayKey('Not/A_Timezone', boundary), '2026-01-01');
  assertEquals(resolveDayKey('x'.repeat(101), boundary), '2026-01-01');
});

Deno.test('resolveDayKey trims a valid timezone', () => {
  assertEquals(resolveDayKey('  America/Los_Angeles  ', boundary), '2025-12-31');
});
