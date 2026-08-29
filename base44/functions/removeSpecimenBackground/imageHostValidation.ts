/**
 * Validates that an image URL belongs to an allowed hosting domain.
 * Prevents domain suffix spoofing attacks (e.g., evilbase44.app or evilamazonaws.com).
 */
export function isValidImageHost(imageUrl: string): boolean {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(imageUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const host = parsed.hostname.toLowerCase();
    const ALLOWED_DOMAINS = ['base44.app', 'base44.com', 'amazonaws.com'];

    return ALLOWED_DOMAINS.some(
      (domain) => host === domain || host.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}
