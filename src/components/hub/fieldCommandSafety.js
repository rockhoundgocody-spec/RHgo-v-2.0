export const FIELD_COMMAND_MAX_LENGTH = 300;

export function normalizeFieldCommand(value) {
  return typeof value === 'string' ? value.trim().slice(0, FIELD_COMMAND_MAX_LENGTH) : '';
}

export function getSafeInternalRoute(value) {
  if (typeof value !== 'string') return null;
  const route = value.trim();
  if (!route.startsWith('/') || route.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(route)) {
    return null;
  }
  return route;
}
