/**
 * Validates whether a given URL is a safe redirect destination for checkout callbacks.
 * To mitigate Open Redirect vulnerabilities, target URLs must use HTTP/HTTPS and belong
 * strictly to permitted domains (localhost, 127.0.0.1, base44.app, or *.base44.app).
 */
export function isValidRedirectTarget(targetUrl: string): boolean {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === 'rhgo.base44.app' ||
      hostname === 'rhgo2.base44.app' ||
      hostname === 'base44.app' ||
      hostname.endsWith('.base44.app')
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
