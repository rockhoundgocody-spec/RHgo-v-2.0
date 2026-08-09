const isNode = typeof window === 'undefined';
const noopStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const storage = isNode ? noopStorage : window.localStorage;

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

export const getSafeRedirectUrl = (url) => {
	if (isNode) {
		return '/';
	}
	if (!url || typeof url !== 'string') {
		return '/';
	}

	const trimmed = url.trim();

	// Check for bypass attempts starting with relative/protocol-relative slashes/backslashes
	if (
		trimmed.startsWith('//') ||
		trimmed.startsWith('\\\\') ||
		trimmed.startsWith('/\\') ||
		trimmed.startsWith('\\/') ||
		trimmed.startsWith('///')
	) {
		return '/';
	}

	// Must either be same-origin absolute URL, or a safe relative path starting with a single '/'
	if (trimmed.startsWith('/')) {
		if (trimmed.length > 1 && (trimmed[1] === '/' || trimmed[1] === '\\')) {
			return '/';
		}
		return trimmed;
	}

	if (trimmed.startsWith('\\')) {
		return '/';
	}

	try {
		const parsed = new URL(trimmed);
		if (parsed.origin === window.location.origin) {
			return trimmed;
		}
	} catch (e) {
		// Not a valid absolute URL, or parse failed
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
		fromUrl: getSafeRedirectUrl(getAppParamValue("from_url", { defaultValue: window.location.href })),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL }),
	}
}


export const appParams = {
	...getAppParams()
}