const noopStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const AUTH_PARAM_NAMES = new Set(['access_token', 'token']);
const AUTH_STORAGE_KEYS = ['base44_access_token', 'base44_token', 'token'];

const isBrowser = () => typeof window !== 'undefined';

const getBrowserStorage = (storageName) => {
	if (!isBrowser()) return noopStorage;

	try {
		return window[storageName] || noopStorage;
	} catch {
		// Storage access can be blocked by browser privacy settings.
		return noopStorage;
	}
};

export const isTokenKey = (paramName) => AUTH_PARAM_NAMES.has(String(paramName).toLowerCase());

// Auth tokens persist in localStorage so the platform session survives tab
// close and return visits (stay-signed-in). sessionStorage is tab-scoped and
// would log users out the moment they closed the tab.
export const getStorageBackend = (_paramName) => getBrowserStorage('localStorage');

const getStoredValue = (storage, key) => {
	try {
		return storage.getItem(key);
	} catch {
		return null;
	}
};

const setStoredValue = (storage, key, value) => {
	try {
		storage.setItem(key, value);
	} catch {
		// App parameters remain available in memory even when storage is disabled.
	}
};

const removeStoredValue = (storage, key) => {
	try {
		storage.removeItem(key);
	} catch {
		// A blocked storage backend is already inaccessible to the application.
	}
};

export const clearStoredAuthTokens = ({ includeSession = true } = {}) => {
	const stores = [getBrowserStorage('localStorage')];
	if (includeSession) stores.push(getBrowserStorage('sessionStorage'));

	for (const storage of stores) {
		for (const key of AUTH_STORAGE_KEYS) removeStoredValue(storage, key);
	}
};

// Tokens now live in localStorage (see getStorageBackend). Do NOT wipe them on
// load — clearing here would log the user out on every refresh.

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * Validates and returns a safe redirect URL.
 * Accepts relative paths starting with a single '/' (blocking '//', '/\', '\\', etc.)
 * or absolute URLs matching the current window's origin.
 * Defaults to defaultUrl (fallback to '/') if invalid.
 */
export const getSafeRedirectUrl = (targetUrl, defaultUrl = '/') => {
	if (!targetUrl || typeof targetUrl !== 'string') {
		return defaultUrl;
	}

	const trimmed = targetUrl.trim();

	// Reject empty strings
	if (!trimmed) {
		return defaultUrl;
	}

	if (trimmed.startsWith('/#') || /[\u0000-\u001f\u007f]/.test(trimmed)) return defaultUrl;

	try {
		const origin = isBrowser() && window.location?.origin
			? window.location.origin
			: 'https://rhgo.invalid';
		const parsed = new URL(trimmed, origin);
		if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) {
			return defaultUrl;
		}

		// Preserve the existing relative return shape after the URL parser has
		// normalized control characters, slashes, and backslashes safely.
		if (trimmed.startsWith('/')) {
			return `${parsed.pathname}${parsed.search}${parsed.hash}`;
		}

		return isBrowser() ? parsed.href : defaultUrl;
	} catch {
		return defaultUrl;
	}
};

export const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (!isBrowser()) {
		return defaultValue;
	}
	const storage = getStorageBackend(paramName);
	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const urlParams = new URLSearchParams(window.location.search);
	const searchParam = urlParams.get(paramName);
	if (removeFromUrl) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;
		window.history.replaceState({}, document.title, newUrl);
	}
	if (searchParam) {
		setStoredValue(storage, storageKey, searchParam);
		return searchParam;
	}
	if (defaultValue) {
		setStoredValue(storage, storageKey, defaultValue);
		return defaultValue;
	}
	const storedValue = getStoredValue(storage, storageKey);
	if (storedValue) {
		return storedValue;
	}
	return null;
}

const getAppParams = () => {
	if (getAppParamValue("clear_access_token") === 'true') {
		clearStoredAuthTokens();
	}
	const rawFromUrl = getAppParamValue("from_url", { defaultValue: isBrowser() ? window.location.href : '/' });
	return {
		appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getSafeRedirectUrl(rawFromUrl, isBrowser() ? window.location.href : '/'),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL }),
	}
}


export const appParams = {
	...getAppParams()
}