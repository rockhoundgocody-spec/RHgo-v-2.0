/**
 * Validates that redirect URLs belong strictly to allowed origins to mitigate
 * Open Redirect risks during payment checkout flows.
 */
export function isValidRedirectTarget(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === 'rockhoundgo.com' ||
      hostname === 'app.rockhoundgo.com' ||
      hostname === 'rhgo.base44.app' ||
      hostname === 'rhgo2.base44.app' ||
      hostname.endsWith('.base44.app')
    );
  } catch (_e) {
    return false;
  }
}
