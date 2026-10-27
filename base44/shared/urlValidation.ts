/**
 * Validates whether an external URL string uses a safe protocol (http: or https:).
 * Prevents DOM XSS attacks caused by `javascript:`, `data:`, or `vbscript:` schemes
 * when user-controlled URLs are rendered in `<a href={...}>` elements.
 */
export function isValidExternalUrl(urlStr: string | null | undefined): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;

  try {
    const parsed = new URL(urlStr.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
