/**
 * Validates whether a redirect URL target belongs to an allowed origin/domain.
 * Prevents Open Redirect vulnerabilities in payment/checkout callbacks.
 */
export function isValidRedirectTarget(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;

  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    if (hostname === 'base44.app' || hostname.endsWith('.base44.app')) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
