/**
 * Validates external URLs for safely rendering in href attributes.
 * Enforces http: or https: protocols to prevent DOM XSS vectors (e.g. javascript: or data: URIs).
 */
export function isValidExternalUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
