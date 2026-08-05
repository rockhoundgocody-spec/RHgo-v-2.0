import { describe, it, expect } from 'vitest';
import { getSafeRedirectUrl } from './app-params.js';

describe('getSafeRedirectUrl', () => {
  it('should allow valid relative paths', () => {
    expect(getSafeRedirectUrl('/dashboard')).toBe('/dashboard');
    expect(getSafeRedirectUrl('/settings?upgrade=success')).toBe('/settings?upgrade=success');
    expect(getSafeRedirectUrl('/profile#achievements')).toBe('/profile#achievements');
    expect(getSafeRedirectUrl('/')).toBe('/');
  });

  it('should trim and allow valid relative paths', () => {
    expect(getSafeRedirectUrl('  /explore  ')).toBe('/explore');
  });

  it('should fallback to "/" for empty, non-string, or falsy inputs', () => {
    expect(getSafeRedirectUrl('')).toBe('/');
    expect(getSafeRedirectUrl(null)).toBe('/');
    expect(getSafeRedirectUrl(undefined)).toBe('/');
    expect(getSafeRedirectUrl(123)).toBe('/');
    expect(getSafeRedirectUrl({})).toBe('/');
  });

  it('should block protocol-relative URLs', () => {
    expect(getSafeRedirectUrl('//attacker.com')).toBe('/');
    expect(getSafeRedirectUrl('\\\\attacker.com')).toBe('/');
    expect(getSafeRedirectUrl('  //attacker.com  ')).toBe('/');
  });

  it('should block relative path evasion vectors (e.g., multiple/backslash leading slashes)', () => {
    expect(getSafeRedirectUrl('/\\attacker.com')).toBe('/');
    expect(getSafeRedirectUrl('//')).toBe('/');
    expect(getSafeRedirectUrl('/\/attacker.com')).toBe('/');
  });

  it('should allow absolute same-origin URLs and extract their relative parts', () => {
    // getOrigin() defaults to http://localhost in Node/SSR tests
    expect(getSafeRedirectUrl('http://localhost/explore')).toBe('/explore');
    expect(getSafeRedirectUrl('http://localhost/settings?upgrade=success')).toBe('/settings?upgrade=success');
  });

  it('should block external/different-origin absolute URLs', () => {
    expect(getSafeRedirectUrl('https://attacker.com/dashboard')).toBe('/');
    expect(getSafeRedirectUrl('http://malicious.com')).toBe('/');
    expect(getSafeRedirectUrl('//evil.com/dashboard')).toBe('/');
  });

  it('should block other protocol schemes like javascript:', () => {
    expect(getSafeRedirectUrl('javascript:alert(1)')).toBe('/');
    expect(getSafeRedirectUrl('data:text/html,<html>')).toBe('/');
  });
});