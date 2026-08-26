import { describe, expect, it } from 'vitest';
import {
  FIELD_COMMAND_MAX_LENGTH,
  getSafeInternalRoute,
  normalizeFieldCommand,
} from './fieldCommandSafety';

describe('field command safety', () => {
  it('trims and bounds command text', () => {
    expect(normalizeFieldCommand('  find quartz  ')).toBe('find quartz');
    expect(normalizeFieldCommand('x'.repeat(500))).toHaveLength(FIELD_COMMAND_MAX_LENGTH);
  });

  it('accepts app-relative routes', () => {
    expect(getSafeInternalRoute('/explore?mineral=quartz')).toBe('/explore?mineral=quartz');
  });

  it.each(['https://evil.example', '//evil.example', '/\\evil.example', '/scan\n/override']) (
    'rejects unsafe route %s',
    (route) => expect(getSafeInternalRoute(route)).toBeNull()
  );
});
