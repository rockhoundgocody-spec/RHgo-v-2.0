/**
 * Validates whether a given external URL uses an allowed web protocol (http: or https:).
 * Enforces protocol checks to prevent DOM XSS via `javascript:`, `data:`, or `vbscript:` schemes
 * when rendering dynamic user/database links in `<a href={...}>` attributes.
 */
export function isValidExternalUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
