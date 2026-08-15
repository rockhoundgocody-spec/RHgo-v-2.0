const isNode = typeof window === 'undefined';
const noopStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const storage = isNode ? noopStorage : window.localStorage;

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * Validates whether a given URL string is safe to redirect to (mitigates Open Redirect).
 * Accepts safe relative paths (e.g. `/dashboard`, `/settings?tab=general`) while
 * blocking protocol-relative URLs (`//evil.com`), backslash bypasses (`/\evil.com`),
 * and external absolute URLs unless they match the current origin (`window.location.origin`).
 *
 * @param {string} urlInput - The URL candidate to validate.
 * @param {string} defaultUrl - Fallback URL if validation fails (defaults to '/').
 * @returns {string} Safe URL string.
 */
export const getSafeRedirectUrl = (urlInput, defaultUrl = '/') => {
	if (!urlInput || typeof urlInput !== 'string') {
		return defaultUrl;
	}

	const trimmed = urlInput.trim();

	// Check relative path: must start with '/' but NOT '//', '/\', or 'control characters'
	if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\') && !trimmed.startsWith('/\t') && !trimmed.startsWith('/\n')) {
		return trimmed;
	}

	// Try parsing absolute URL and check against window.location.origin
	try {
		const parsed = new URL(trimmed, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
		if (typeof window !== 'undefined' && window.location && window.location.origin) {
			if (parsed.origin === window.location.origin) {
				return parsed.pathname + parsed.search + parsed.hash;
			}
		}
	} catch (_) {
		// Ignore parse failure
	}

	return defaultUrl;
};

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (isNode) {
		return defaultValue;
	}
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
		storage.setItem(storageKey, searchParam);
		return searchParam;
	}
	if (defaultValue) {
		storage.setItem(storageKey, defaultValue);
		return defaultValue;
	}
	const storedValue = storage.getItem(storageKey);
	if (storedValue) {
		return storedValue;
	}
	return null;
}

const getAppParams = () => {
	if (getAppParamValue("clear_access_token") === 'true') {
		storage.removeItem('base44_access_token');
		storage.removeItem('token');
	}
	const rawFromUrl = getAppParamValue("from_url", { defaultValue: window.location.href });
	return {
		appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getSafeRedirectUrl(rawFromUrl, '/'),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL }),
	}
}


export const appParams = {
	...getAppParams()
}
