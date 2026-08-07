const noopStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

export const getSafeRedirectUrl = (url, defaultValue = '/') => {
	if (!url || typeof url !== 'string') {
		return defaultValue;
	}
	const trimmed = url.trim();

	// Prevent open redirect bypass attempts like //, \\, /\, or ///
	if (
		trimmed.startsWith('//') ||
		trimmed.startsWith('\\\\') ||
		trimmed.startsWith('\\') ||
		trimmed.startsWith('/\\') ||
		trimmed.startsWith('\\/')
	) {
		return defaultValue;
	}

	// Allow relative paths starting with a single '/'
	if (
		trimmed.startsWith('/') &&
		!trimmed.startsWith('//') &&
		!trimmed.startsWith('/\\') &&
		!trimmed.startsWith('\\')
	) {
		return trimmed;
	}

	// Check if it is a same-origin absolute URL
	if (typeof window !== 'undefined') {
		try {
			const parsedUrl = new URL(trimmed, window.location.origin);
			if (parsedUrl.origin === window.location.origin) {
				return trimmed;
			}
		} catch (e) {
			// Not a valid URL, ignore
		}
	}

	return defaultValue;
};

// Purge legacy keys from localStorage to prevent token leakage
export const purgeLegacyKeys = () => {
	if (typeof window !== 'undefined') {
		try {
			window.localStorage.removeItem('base44_access_token');
			window.localStorage.removeItem('base44_token');
			window.localStorage.removeItem('token');
		} catch (e) {
			// Ignore any storage access errors
		}
	}
};

const getStorageForParam = (paramName) => {
	if (typeof window === 'undefined') return noopStorage;
	const name = paramName.toLowerCase();
	if (name === 'access_token' || name === 'token') {
		return window.sessionStorage;
	}
	return window.localStorage;
};

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (typeof window === 'undefined') {
		return defaultValue;
	}
	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const paramStorage = getStorageForParam(paramName);
	const urlParams = new URLSearchParams(window.location.search);
	const searchParam = urlParams.get(paramName);
	if (removeFromUrl) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;
		window.history.replaceState({}, typeof document !== 'undefined' ? document.title : "", newUrl);
	}
	if (searchParam) {
		paramStorage.setItem(storageKey, searchParam);
		return searchParam;
	}
	if (defaultValue) {
		paramStorage.setItem(storageKey, defaultValue);
		return defaultValue;
	}
	const storedValue = paramStorage.getItem(storageKey);
	if (storedValue) {
		return storedValue;
	}
	return null;
}

const getAppParams = () => {
	const hasWindow = typeof window !== 'undefined';
	if (getAppParamValue("clear_access_token") === 'true') {
		if (hasWindow) {
			try {
				window.sessionStorage.removeItem('base44_access_token');
				window.sessionStorage.removeItem('base44_token');
				window.localStorage.removeItem('base44_access_token');
				window.localStorage.removeItem('base44_token');
				window.localStorage.removeItem('token');
			} catch (e) {
				// Ignore
			}
		}
	}
	return {
		appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getSafeRedirectUrl(getAppParamValue("from_url"), hasWindow ? window.location.href : undefined),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL }),
	}
}

// Run purge on module initialization
purgeLegacyKeys();

export const appParams = {
	...getAppParams()
}
