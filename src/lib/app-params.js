const isNode = typeof window === 'undefined';
const noopStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const storage = isNode ? noopStorage : window.localStorage;

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

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
		window.history.replaceState({}, typeof document !== 'undefined' ? document.title : '', newUrl);
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

/**
 * Safely validates redirect URLs to prevent Open Redirect vulnerabilities.
 * Only permits relative paths starting with a single '/' (and not '//', '\\', '/\', '///')
 * or absolute http/https URLs with matching origin.
 */
export const getSafeRedirectUrl = (url, fallback = '/') => {
	if (!url || typeof url !== 'string') return fallback;
	const trimmed = url.trim();
	if (!trimmed) return fallback;

	// Reject paths starting with backslashes or double slashes or mixed slash attempts
	if (/^[/\\]{2,}/.test(trimmed) || /^\\/.test(trimmed) || /^\/[\\/]/.test(trimmed)) {
		return fallback;
	}

	// Safe relative paths starting with a single '/'
	if (trimmed.startsWith('/')) {
		return trimmed;
	}

	if (!isNode && window.location && window.location.origin) {
		try {
			const parsed = new URL(trimmed, window.location.origin);
			if (parsed.origin === window.location.origin && (parsed.protocol === 'http:' || parsed.protocol === 'https:')) {
				return parsed.href;
			}
		} catch {
			return fallback;
		}
	}

	return fallback;
};

const getAppParams = () => {
	if (getAppParamValue("clear_access_token") === 'true') {
		storage.removeItem('base44_access_token');
		storage.removeItem('token');
	}
	const defaultFromUrl = !isNode && window.location ? window.location.href : '/';
	return {
		appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getSafeRedirectUrl(getAppParamValue("from_url"), defaultFromUrl),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL }),
	}
}


export const appParams = {
	...getAppParams()
}
