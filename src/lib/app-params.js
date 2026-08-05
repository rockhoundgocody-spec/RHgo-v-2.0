const isNode = typeof window === 'undefined';
const noopStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const storage = isNode ? noopStorage : window.localStorage;

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getOrigin = () => {
	if (typeof window !== 'undefined' && window.location) {
		return window.location.origin;
	}
	return 'http://localhost'; // Fallback for Node/SSR tests
};

export const getSafeRedirectUrl = (url) => {
	if (!url || typeof url !== 'string') {
		return '/';
	}

	const trimmed = url.trim();

	// Avoid protocol-relative URLs (e.g., //attacker.com) and multiple slashes at the start
	if (trimmed.startsWith('//') || trimmed.startsWith('\\\\')) {
		return '/';
	}

	// Handle relative paths starting with a single '/'
	if (trimmed.startsWith('/')) {
		// Ensure it doesn't contain a second slash at the beginning (e.g. /\\attacker.com or //attacker.com)
		if (trimmed.length > 1 && (trimmed[1] === '/' || trimmed[1] === '\\')) {
			return '/';
		}
		return trimmed;
	}

	// Handle absolute URLs, must be same-origin
	try {
		const origin = getOrigin();
		const parsedUrl = new URL(trimmed, origin);
		if (parsedUrl.origin === origin) {
			return parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
		}
	} catch (e) {
		// Fail-safe default
	}

	return '/';
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
	return {
		appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getSafeRedirectUrl(getAppParamValue("from_url", { defaultValue: typeof window !== 'undefined' ? window.location.href : '/' })),
		redirect: getSafeRedirectUrl(getAppParamValue("redirect", { defaultValue: '/' })),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL }),
	}
}


export const appParams = {
	...getAppParams()
}