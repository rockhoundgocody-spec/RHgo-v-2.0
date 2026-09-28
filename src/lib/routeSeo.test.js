import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { PUBLIC_INDEXABLE_PATHS, SIGNED_IN_PATHS, isIndexablePath, canonicalFor, normalizePath } from './routeSeo';

describe('routeSeo', () => {
  it('indexable pages are exactly the sitemap pages', () => {
    const xml = fs.readFileSync(path.resolve(__dirname, '../../public/sitemap.xml'), 'utf8');
    const locs = [...xml.matchAll(/<loc>https:\/\/rhgo\.me([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
    expect([...locs].sort()).toEqual([...PUBLIC_INDEXABLE_PATHS].sort());
  });

  it('public pages are indexable in any casing, with or without a trailing slash', () => {
    for (const p of ['/', '/about', '/About/', '/agate-guide', '/pricing?x=1', '/clubs']) {
      expect(isIndexablePath(p)).toBe(true);
    }
  });

  it('sign-in, app screens and unknown URLs are not indexable', () => {
    for (const p of ['/signin', '/register', '/forgot-password', '/onboarding', '/vault', '/admin',
      '/settings', '/explore', '/live/abc123', '/.env', '/wp-login.php', '/nonexistent-page-12345']) {
      expect(isIndexablePath(p)).toBe(false);
    }
  });

  it('no signed-in screen is also listed as public', () => {
    for (const p of SIGNED_IN_PATHS) expect(isIndexablePath(p)).toBe(false);
  });

  it('canonical URLs are absolute, lower-case and slash-normalized', () => {
    expect(canonicalFor('/')).toBe('https://rhgo.me/');
    expect(canonicalFor('/About/')).toBe('https://rhgo.me/about');
    expect(canonicalFor('/pricing?ref=x#top')).toBe('https://rhgo.me/pricing');
    expect(normalizePath('')).toBe('/');
  });
});
