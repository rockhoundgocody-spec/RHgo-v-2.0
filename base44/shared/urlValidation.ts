/**
 * Canonical External URL Validation Utility
 * Validates external URLs to ensure they strictly use http: or https: protocols,
 * preventing DOM XSS vulnerabilities from javascript: or data: schemes when rendered in href attributes.
 */
export function isValidExternalUrl(urlStr: string | null | undefined): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
