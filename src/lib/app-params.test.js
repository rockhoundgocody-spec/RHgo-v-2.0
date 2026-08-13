import { vi, describe, it, expect, beforeAll } from 'vitest';

beforeAll(() => {
  globalThis.window = {
    location: {
      search: '?from_url=https://malicious.com',
      href: 'http://localhost:3000/',
      pathname: '/',
      origin: 'http://localhost:3000',
    },
    history: {
      replaceState: vi.fn(),
    },
    localStorage: {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    },
  };
  globalThis.document = {
    title: 'Test Title',
  };
});

describe('getSafeRedirectUrl', () => {
  it('should allow safe relative paths', async () => {
    const { getSafeRedirectUrl } = await import('./app-params.js');
    expect(getSafeRedirectUrl('/explore')).toBe('/explore');
  });

  it('should block bad relative paths (bypass attempts like // or /\\)', async () => {
    const { getSafeRedirectUrl } = await import('./app-params.js');
    expect(getSafeRedirectUrl('//malicious.com')).toBe('/');
    expect(getSafeRedirectUrl('/\\malicious.com')).toBe('/');
    expect(getSafeRedirectUrl('\\\\malicious.com')).toBe('/');
    expect(getSafeRedirectUrl('///malicious.com')).toBe('/');
    expect(getSafeRedirectUrl('/%5Cmalicious.com')).toBe('/');
  });

  it('should allow same-origin absolute URLs', async () => {
    const { getSafeRedirectUrl } = await import('./app-params.js');
    expect(getSafeRedirectUrl('http://localhost:3000/explore')).toBe('http://localhost:3000/explore');
  });

  it('should block off-origin absolute URLs', async () => {
    const { getSafeRedirectUrl } = await import('./app-params.js');
    expect(getSafeRedirectUrl('https://malicious.com/explore')).toBe('/');
  });
});
