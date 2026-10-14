/**
 * Validates whether a given URL string uses a safe external web protocol (http: or https:).
 * Prevents DOM XSS vectors like `javascript:` or `data:` schemes when rendering
 * database-stored or user-supplied external links in `<a href={...}>`.
 */
export function isValidExternalUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false;

  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
