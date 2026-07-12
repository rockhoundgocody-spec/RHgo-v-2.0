const noopStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

export const isTokenKey = (paramName) => {
	const nameLower = paramName.toLowerCase();
	return nameLower === 'access_token' || nameLower === 'token' || nameLower.includes('token');
}

export const getStorageBackend = (paramName) => {
	if (typeof window === 'undefined') {
		return noopStorage;
	}
	if (isTokenKey(paramName)) {
		return typeof window !== 'undefined' ? window.sessionStorage : noopStorage;
	}
	return typeof window !== 'undefined' ? window.localStorage : noopStorage;
}

// On initialization, purge historical sensitive tokens from localStorage
if (typeof window !== 'undefined') {
	try {
		window.localStorage.removeItem('base44_access_token');
		window.localStorage.removeItem('base44_token');
		window.localStorage.removeItem('token');
	} catch (e) {
		console.error('Failed to purge historical tokens from localStorage:', e);
	}
}

const getUrlParams = () => {
	if (typeof window === 'undefined' || !window.location) {
		return new URLSearchParams();
	}
	return new URLSearchParams(window.location.search);
}

export const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (typeof window === 'undefined') {
		return defaultValue;
	}
	const currentStorage = getStorageBackend(paramName);
	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const urlParams = getUrlParams();
	const searchParam = urlParams.get(paramName);
	if (removeFromUrl && typeof window !== 'undefined' && window.location) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;
		window.history.replaceState({}, typeof document !== 'undefined' ? document.title : "", newUrl);
	}
	if (searchParam) {
		currentStorage.setItem(storageKey, searchParam);
		return searchParam;
	}
	if (defaultValue) {
		currentStorage.setItem(storageKey, defaultValue);
		return defaultValue;
	}
	const storedValue = currentStorage.getItem(storageKey);
	if (storedValue) {
		return storedValue;
	}
	return null;
}

export const getAppParams = () => {
	if (getAppParamValue("clear_access_token") === 'true') {
		if (typeof window !== 'undefined') {
			window.localStorage.removeItem('base44_access_token');
			window.localStorage.removeItem('base44_token');
			window.localStorage.removeItem('token');
			window.sessionStorage.removeItem('base44_access_token');
			window.sessionStorage.removeItem('base44_token');
			window.sessionStorage.removeItem('token');
		}
	}
	return {
		appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getAppParamValue("from_url", { defaultValue: typeof window !== 'undefined' && window.location ? window.location.href : undefined }),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL }),
	}
}

export const appParams = {
	...getAppParams()
}
