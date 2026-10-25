/**
 * Validates whether an external URL strictly uses http: or https: protocol.
 * Prevents DOM-based XSS via javascript:, data:, or file: schemes when rendering
 * user-supplied external links in anchor tags (e.g. href={url}).
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
