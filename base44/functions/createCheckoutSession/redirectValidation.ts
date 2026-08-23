export function isValidRedirectTarget(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    const ALLOWED_EXACT_HOSTNAMES = new Set([
      'localhost',
      '127.0.0.1',
      'rhgo.base44.app',
      'rhgo2.base44.app',
    ]);

    const ALLOWED_DOMAIN_SUFFIXES = [
      '.rhgo.base44.app',
      '.rhgo2.base44.app',
    ];

    if (ALLOWED_EXACT_HOSTNAMES.has(hostname)) {
      return true;
    }

    if (ALLOWED_DOMAIN_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
