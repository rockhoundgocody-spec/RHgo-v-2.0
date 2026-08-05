const isNode = typeof window === 'undefined';
const noopStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

// Purge legacy local storage keys proactively on module initialization to mitigate token leakage
if (typeof window !== 'undefined' && window.localStorage) {
	try {
		window.localStorage.removeItem('base44_access_token');
		window.localStorage.removeItem('base44_token');
		window.localStorage.removeItem('token');
	} catch (e) {
		console.warn('Failed to clear legacy localStorage keys:', e);
	}
}

/**
 * Validates a redirect URL to prevent Open Redirect vulnerabilities.
 * Only same-origin absolute URLs or relative paths starting with a single '/' are allowed.
 *
 * @param {string} url - The redirect target URL to validate.
 * @param {string} fallbackUrl - The fallback URL to return if validation fails.
 * @returns {string} - The sanitized redirect URL.
 */
export const getSafeRedirectUrl = (url, fallbackUrl = '/') => {
	if (!url || typeof url !== 'string') {
		return fallbackUrl;
	}

	const cleanUrl = url.trim();

	// Allow relative paths starting with a single '/'
	// Ensures it doesn't start with '//', '\\', '/\', or '\/' to prevent bypass attempts
	if (cleanUrl.startsWith('/') &&
		!cleanUrl.startsWith('//') &&
		!cleanUrl.startsWith('\\\\') &&
		!cleanUrl.startsWith('/\\') &&
		!cleanUrl.startsWith('/\/')) {
		return cleanUrl;
	}

	if (isNode) {
		return fallbackUrl;
	}

	try {
		const parsed = new URL(cleanUrl, window.location.origin);
		if (parsed.origin === window.location.origin) {
			return cleanUrl;
		}
	} catch (e) {
		// Ignore and fallback
	}

	return fallbackUrl;
};

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (isNode) {
		return defaultValue;
	}
	// Security: route sensitive tokens to sessionStorage instead of persistent localStorage
	const isSensitive = paramName === 'access_token' || paramName === 'token';
	const targetStorage = isSensitive
		? (window.sessionStorage || noopStorage)
		: (window.localStorage || noopStorage);

	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const urlParams = new URLSearchParams(window.location.search);
	const searchParam = urlParams.get(paramName);
	if (removeFromUrl) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;

		if (window.history && typeof window.history.replaceState === 'function') {
			const docTitle = (window.document && window.document.title) || '';
			window.history.replaceState({}, docTitle, newUrl);
		}
	}
	if (searchParam) {
		targetStorage.setItem(storageKey, searchParam);
		return searchParam;
	}
	if (defaultValue) {
		targetStorage.setItem(storageKey, defaultValue);
		return defaultValue;
	}
	const storedValue = targetStorage.getItem(storageKey);
	if (storedValue) {
		return storedValue;
	}
	return null;
}

const getAppParams = () => {
	if (getAppParamValue("clear_access_token") === 'true') {
		if (typeof window !== 'undefined') {
			if (window.sessionStorage) {
				window.sessionStorage.removeItem('base44_access_token');
				window.sessionStorage.removeItem('base44_token');
				window.sessionStorage.removeItem('token');
			}
			if (window.localStorage) {
				window.localStorage.removeItem('base44_access_token');
				window.localStorage.removeItem('base44_token');
				window.localStorage.removeItem('token');
			}
		}
	}
	return {
		appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getSafeRedirectUrl(getAppParamValue("from_url", { defaultValue: window.location.href })),
		redirectUrl: getSafeRedirectUrl(getAppParamValue("redirect", { defaultValue: '/' })),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL }),
	}
}


export const appParams = {
	...getAppParams()
}
