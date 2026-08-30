const ALLOWED_DOMAINS = ['base44.app', 'base44.com', 'amazonaws.com'];

export function isValidUploadedImageUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}
