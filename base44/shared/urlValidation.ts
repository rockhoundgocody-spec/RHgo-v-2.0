/**
 * Validates external URLs before rendering in <a href={...}> attributes.
 * Enforces http: or https: protocols to prevent DOM XSS vectors (e.g. javascript:, data:).
 */
export function isValidExternalUrl(url: unknown): boolean {
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
