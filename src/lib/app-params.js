const isNode = typeof window === 'undefined';
const noopStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

// Proactively purge legacy sensitive keys from localStorage to prevent lingering token leakage
if (!isNode) {
	try {
		window.localStorage.removeItem('base44_access_token');
		window.localStorage.removeItem('token');
	} catch (e) {
		// ignore
	}
}

// Helper to determine whether we should store parameter in sessionStorage (for sensitive tokens) or localStorage
export const getStorageForParam = (paramName) => {
	if (isNode) return noopStorage;
	const nameLower = paramName ? paramName.toLowerCase() : '';
	const isSensitive = nameLower.includes('token') || nameLower.includes('access_token');
	return isSensitive ? window.sessionStorage : window.localStorage;
};

// Validates redirect URLs to prevent Open Redirect vulnerabilities
export const getSafeRedirectUrl = (url, defaultUrl = '/') => {
	if (!url) return defaultUrl;
	if (isNode) return defaultUrl;

	try {
		// Prevent Open Redirect bypasses (e.g., //, \\, /\, \/, ///)
		if (
			url.startsWith('//') ||
			url.startsWith('\\\\') ||
			url.startsWith('/\\') ||
			url.startsWith('\\/') ||
			url.startsWith('///')
		) {
			return defaultUrl;
		}

		// Regex check for multiple slash/backslash sequences at the beginning
		if (/^[/\\]{2,}/.test(url) || /^\/\\/.test(url) || /^\\\//.test(url)) {
			return defaultUrl;
		}

		// Relative paths starting with a single '/'
		if (url.startsWith('/')) {
			return url;
		}

		// Same-origin absolute URLs
		const parsed = new URL(url, window.location.origin);
		if (parsed.origin === window.location.origin) {
			return url;
		}
	} catch (e) {
		// Fall through
	}

	return defaultUrl;
};

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (isNode) {
		return defaultValue;
	}
	const paramStorage = getStorageForParam(paramName);
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

const getWindowHref = () => {
	return typeof window !== 'undefined' ? window.location.href : '';
};

const getAppParams = () => {
	if (getAppParamValue("clear_access_token") === 'true') {
		if (!isNode) {
			window.sessionStorage.removeItem('base44_access_token');
			window.sessionStorage.removeItem('token');
			window.localStorage.removeItem('base44_access_token');
			window.localStorage.removeItem('token');
		}
	}
	return {
		appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getSafeRedirectUrl(getAppParamValue("from_url", { defaultValue: getWindowHref() }), getWindowHref()),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL }),
	}
}

export const appParams = {
	...getAppParams()
}