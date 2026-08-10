const isNode = typeof window === 'undefined';
const noopStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const getStorageForKey = (key) => {
	if (isNode) return noopStorage;
	if (key && key.includes('token')) {
		return window.sessionStorage;
	}
	return window.localStorage;
};

const storage = isNode ? noopStorage : {
	getItem: (key) => getStorageForKey(key).getItem(key),
	setItem: (key, value) => getStorageForKey(key).setItem(key, value),
	removeItem: (key) => getStorageForKey(key).removeItem(key),
};

// Purge legacy keys containing 'token' from localStorage on initialization
if (!isNode) {
	try {
		window.localStorage.removeItem('base44_access_token');
		window.localStorage.removeItem('token');
		for (let i = 0; i < window.localStorage.length; i++) {
			const key = window.localStorage.key(i);
			if (key && key.includes('token')) {
				window.localStorage.removeItem(key);
				i--; // adjust index since an item was removed
			}
		}
	} catch (e) {
		// Fail securely
	}
}

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

export const getSafeRedirectUrl = (url, fallback = '/') => {
	if (!url || typeof url !== 'string') return fallback;
	const cleanUrl = url.trim();

	// Check for bypass attempts like //, \\, /\, \/, ///
	if (
		cleanUrl.startsWith('//') ||
		cleanUrl.startsWith('\\\\') ||
		cleanUrl.startsWith('/\\') ||
		cleanUrl.startsWith('\\/') ||
		cleanUrl.startsWith('///')
	) {
		return fallback;
	}

	// If it starts with a backslash, reject it to prevent certain browser bypasses
	if (cleanUrl.startsWith('\\')) {
		return fallback;
	}

	try {
		const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';

		// If it's a relative path starting with a single /
		if (cleanUrl.startsWith('/')) {
			// Additional safety check: ensure the second character is not a slash or backslash
			const secondChar = cleanUrl.charAt(1);
			if (secondChar === '/' || secondChar === '\\') {
				return fallback;
			}
			return cleanUrl;
		}

		// Parse as an absolute URL
		const parsed = new URL(cleanUrl);
		if (parsed.origin === base) {
			return cleanUrl;
		}
	} catch (e) {
		// If it fails to parse as absolute, fallback
	}

	return fallback;
};

const getAppParams = () => {
	if (getAppParamValue("clear_access_token") === 'true') {
		storage.removeItem('base44_access_token');
		storage.removeItem('token');
	}
	const defaultFromUrl = typeof window !== 'undefined' ? window.location.href : 'http://localhost/';
	return {
		appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getSafeRedirectUrl(getAppParamValue("from_url", { defaultValue: defaultFromUrl }), defaultFromUrl),
		redirect: getSafeRedirectUrl(getAppParamValue("redirect", { defaultValue: '/' }), '/'),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL }),
	}
}

export const appParams = {
	...getAppParams()
}
