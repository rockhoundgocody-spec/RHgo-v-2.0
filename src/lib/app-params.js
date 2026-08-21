const isNode = typeof window === 'undefined';
const noopStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const storage = isNode ? noopStorage : window.localStorage;

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * Validates and sanitizes redirect URLs to prevent Open Redirect vulnerabilities.
 * Allows relative paths (starting with '/') and same-origin absolute URLs,
 * while blocking dangerous patterns like protocol-relative URLs ('//'),
 * backslash evasions ('/\\'), non-http(s) protocols, or external domains.
 *
 * @param {string} targetUrl - The redirect URL to check.
 * @param {string} fallback - The safe fallback URL to return if invalid (defaults to '/').
 * @returns {string} Safe relative path or same-origin path.
 */
export const getSafeRedirectUrl = (targetUrl, fallback = '/') => {
	if (!targetUrl || typeof targetUrl !== 'string') {
		return fallback;
	}

	const trimmed = targetUrl.trim();
	if (!trimmed) {
		return fallback;
	}

	// Reject protocol-relative URLs or backslash evasions (e.g. "//evil.com", "/\evil.com", "\evil.com")
	if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\')) {
		return fallback;
	}

	// Handle relative URLs
	if (trimmed.startsWith('/')) {
		// Ensure it doesn't start with multiple slashes like "///evil.com"
		if (/^\/{2,}/.test(trimmed)) {
			return fallback;
		}
		return trimmed;
	}

	// Handle absolute URLs (must match window.location.origin if available)
	try {
		const parsed = new URL(trimmed);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			return fallback;
		}
		if (typeof window !== 'undefined' && window.location && window.location.origin) {
			if (parsed.origin === window.location.origin) {
				return parsed.pathname + parsed.search + parsed.hash;
			}
			return fallback;
		}
		return fallback;
	} catch {
		return fallback;
	}
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
		const docTitle = typeof document !== 'undefined' ? document.title : '';
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;
		window.history.replaceState({}, docTitle, newUrl);
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
	const defaultFromUrl = isNode ? '/' : (typeof window !== 'undefined' && window.location ? window.location.href : '/');
	const rawFromUrl = getAppParamValue("from_url", { defaultValue: defaultFromUrl });

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
