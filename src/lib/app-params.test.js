import { describe, it, expect, beforeAll } from 'vitest';

let getSafeRedirectUrl;

beforeAll(async () => {
	globalThis.window = {
		location: {
			origin: 'http://localhost:3000',
			href: 'http://localhost:3000',
			pathname: '/',
			search: '',
			hash: '',
		},
		localStorage: {
			getItem: () => null,
			setItem: () => {},
			removeItem: () => {},
		},
		history: {
			replaceState: () => {},
		},
	};
	globalThis.document = {
		title: 'RockHound GO',
	};

	const mod = await import('./app-params');
	getSafeRedirectUrl = mod.getSafeRedirectUrl;
});

describe('getSafeRedirectUrl', () => {
	it('returns valid relative paths', () => {
		expect(getSafeRedirectUrl('/dashboard')).toBe('/dashboard');
		expect(getSafeRedirectUrl('/onboarding?step=2')).toBe('/onboarding?step=2');
		expect(getSafeRedirectUrl('/settings#profile')).toBe('/settings#profile');
	});

	it('returns default URL for empty or non-string inputs', () => {
		expect(getSafeRedirectUrl('')).toBe('/');
		expect(getSafeRedirectUrl(null)).toBe('/');
		expect(getSafeRedirectUrl(undefined, '/fallback')).toBe('/fallback');
		expect(getSafeRedirectUrl(123)).toBe('/');
	});

	it('blocks protocol-relative open redirect vectors (//evil.com)', () => {
		expect(getSafeRedirectUrl('//evil.com')).toBe('/');
		expect(getSafeRedirectUrl('//attacker.com/login')).toBe('/');
		expect(getSafeRedirectUrl('///evil.com')).toBe('/');
	});

	it('blocks backslash open redirect vectors (/\\evil.com)', () => {
		expect(getSafeRedirectUrl('/\\evil.com')).toBe('/');
		expect(getSafeRedirectUrl('/\\attacker.com')).toBe('/');
	});

	it('allows same-origin absolute URLs', () => {
		const safeUrl = 'http://localhost:3000/settings?upgrade=success';
		expect(getSafeRedirectUrl(safeUrl)).toBe(safeUrl);
	});

	it('rejects external absolute URLs', () => {
		expect(getSafeRedirectUrl('https://evil.com/phish')).toBe('/');
		expect(getSafeRedirectUrl('https://attacker.org')).toBe('/');
		expect(getSafeRedirectUrl('javascript:alert(1)')).toBe('/');
	});
});
