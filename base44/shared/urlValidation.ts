/**
 * Validates external URLs to ensure they strictly use http: or https: protocols.
 * Prevents DOM XSS vulnerabilities from javascript: or data: URL schemes
 * when rendering dynamic user or database links in href attributes.
 */
export function isValidExternalUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
