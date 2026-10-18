/**
 * Validates external web URLs before rendering them in anchor `href` attributes
 * or using them in external requests. Enforces strictly `http:` or `https:` protocols
 * to prevent DOM Cross-Site Scripting (XSS) via `javascript:`, `data:`, or `vbscript:` schemes.
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
