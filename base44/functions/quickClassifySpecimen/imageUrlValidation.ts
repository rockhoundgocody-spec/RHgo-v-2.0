const ALLOWED_DOMAINS = ['base44.app', 'base44.com', 'amazonaws.com'];

/**
 * Validates whether an image URL originates from an authorized storage domain.
 * Prevents domain suffix spoofing (e.g. `evilbase44.app`) and non-HTTP protocols.
 */
export function isValidImageUrl(imageUrl: string | null | undefined): boolean {
  if (!imageUrl || typeof imageUrl !== 'string') return false;

  try {
    const parsed = new URL(imageUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const host = parsed.hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(
      (domain) => host === domain || host.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}
