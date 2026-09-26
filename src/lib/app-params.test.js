import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

let getSafeRedirectUrl;
let getAppParamValue;
let getStorageBackend;
let clearStoredAuthTokens;

const createStorage = () => {
	const values = new Map();
	return {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => values.set(key, String(value)),
		removeItem: (key) => values.delete(key),
		clear: () => values.clear(),
	};
};

const localStorage = createStorage();
const sessionStorage = createStorage();

beforeAll(async () => {
	globalThis.window = {
		location: {
			origin: 'http://localhost:3000',
			href: 'http://localhost:3000',
			pathname: '/',
			search: '',
			hash: '',
		},
		localStorage,
		sessionStorage,
		history: {
			replaceState: () => {},
		},
	};
	globalThis.document = {
		title: 'RockHound GO',
	};

	const mod = await import('./app-params');
	getSafeRedirectUrl = mod.getSafeRedirectUrl;
	getAppParamValue = mod.getAppParamValue;
	getStorageBackend = mod.getStorageBackend;
	clearStoredAuthTokens = mod.clearStoredAuthTokens;
});

beforeEach(() => {
	localStorage.clear();
	sessionStorage.clear();
	window.location.search = '';
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

	it('blocks control-character redirect vectors after browser normalization', () => {
		expect(getSafeRedirectUrl('/\t//evil.com')).toBe('/');
		expect(getSafeRedirectUrl('/\n//evil.com')).toBe('/');
		expect(getSafeRedirectUrl('/\r//evil.com')).toBe('/');
		expect(getSafeRedirectUrl('/\u0000//evil.com')).toBe('/');
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

describe('app parameter storage', () => {
	it('persists access tokens in localStorage so sessions survive tab close', () => {
		window.location.search = '?access_token=short-lived-secret';

		expect(getAppParamValue('access_token')).toBe('short-lived-secret');
		expect(localStorage.getItem('base44_access_token')).toBe('short-lived-secret');
		expect(getStorageBackend('access_token')).toBe(localStorage);
	});

	it('keeps non-sensitive application parameters in localStorage', () => {
		window.location.search = '?app_id=app-123';

		expect(getAppParamValue('app_id')).toBe('app-123');
		expect(getStorageBackend('app_id')).toBe(localStorage);
		expect(localStorage.getItem('base44_app_id')).toBe('app-123');
		expect(sessionStorage.getItem('base44_app_id')).toBeNull();
	});

	it('clears legacy and session-scoped auth keys', () => {
		for (const storage of [localStorage, sessionStorage]) {
			storage.setItem('base44_access_token', 'secret');
			storage.setItem('base44_token', 'secret');
			storage.setItem('token', 'secret');
		}

		clearStoredAuthTokens();

		for (const storage of [localStorage, sessionStorage]) {
			expect(storage.getItem('base44_access_token')).toBeNull();
			expect(storage.getItem('base44_token')).toBeNull();
			expect(storage.getItem('token')).toBeNull();
		}
	});

	it('does not classify unrelated parameter names as credentials', () => {
		expect(getStorageBackend('tokenizer_theme')).toBe(localStorage);
	});
});
