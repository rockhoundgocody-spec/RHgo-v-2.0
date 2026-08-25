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
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === 'rhgo.base44.app' ||
      hostname === 'rhgo2.base44.app' ||
      hostname.endsWith('.base44.app')
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
