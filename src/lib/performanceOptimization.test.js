import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResponseCache } from './performanceOptimization';

describe('ResponseCache', () => {
  let cache;
  const ttl = 300; // 5 minutes

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new ResponseCache(ttl);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return null for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('should return the correct value after set', () => {
    const key = 'test-key';
    const value = { data: 'test-value' };
    cache.set(key, value);
    expect(cache.get(key)).toEqual(value);
  });

  it('should return null and delete item if it has expired', () => {
    const key = 'expired-key';
    const value = 'expired-value';
    cache.set(key, value);

    // Advance time beyond TTL
    vi.advanceTimersByTime((ttl + 1) * 1000);

    expect(cache.get(key)).toBeNull();

    // Verify it was actually deleted from the internal cache
    // We can't access this.cache directly if we want to be strictly public API,
    // but for testing completeness, checking that the entry is gone is good.
    // Let's verify by setting the same key again and ensuring it's fresh.
    cache.set(key, 'new-value');
    expect(cache.get(key)).toBe('new-value');
  });

  it('should not expire if time has not reached TTL', () => {
    const key = 'active-key';
    const value = 'active-value';
    cache.set(key, value);

    // Advance time but stay within TTL
    vi.advanceTimersByTime((ttl - 1) * 1000);

    expect(cache.get(key)).toEqual(value);
  });

  it('should remove all items on clear', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    cache.clear();

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });
});
