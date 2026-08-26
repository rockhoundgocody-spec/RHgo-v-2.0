const isNode = typeof window === 'undefined';
const noopStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const storage = isNode ? noopStorage : window.localStorage;

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

	// Remove ASCII control characters (0x00-0x1F, 0x7F) and trim
	const sanitized = targetUrl.replace(/[\x00-\x1F\x7F]/g, '').trim();

	// Reject empty strings or multi-slash / backslash protocol-relative vectors
	if (!sanitized || sanitized.startsWith('//') || sanitized.startsWith('/\\') || sanitized.startsWith('/#')) {
		return defaultUrl;
	}

	try {
		const origin = (!isNode && typeof window !== 'undefined' && window.location?.origin)
			? window.location.origin
			: 'http://localhost';

		const parsed = new URL(sanitized, origin);

		// Must be http: or https: protocol
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			return defaultUrl;
		}

		// Must match current origin
		if (parsed.origin !== origin) {
			return defaultUrl;
		}

		// Relative path: preserve pathname, query params, and hash
		if (sanitized.startsWith('/')) {
			if (parsed.pathname.startsWith('//') || parsed.pathname.includes('\\')) {
				return defaultUrl;
			}
			return `${parsed.pathname}${parsed.search}${parsed.hash}`;
		}

		return parsed.href;
	} catch {
		return defaultUrl;
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
	const rawFromUrl = getAppParamValue("from_url", { defaultValue: isNode ? '/' : window.location.href });
	return {
		appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getSafeRedirectUrl(rawFromUrl, isNode ? '/' : window.location.href),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL }),
	}
}


export const appParams = {
	...getAppParams()
}
