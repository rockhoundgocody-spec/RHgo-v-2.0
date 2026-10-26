/**
 * Validates external URLs before rendering in href attributes or passing to external services.
 * Strictly enforces http: or https: protocols to prevent DOM XSS via javascript:, data:, or vbscript: schemes.
 */
export function isValidExternalUrl(url) {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
