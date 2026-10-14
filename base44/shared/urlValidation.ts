import { isValidExternalUrl as isValid } from '../../src/lib/urlValidation.js';

/**
 * Validates whether a given URL string uses a safe external web protocol (http: or https:).
 * Prevents DOM XSS vectors like `javascript:` or `data:` schemes when rendering
 * database-stored or user-supplied external links in `<a href={...}>`.
 */
export function isValidExternalUrl(urlStr: string | null | undefined): boolean {
  return isValid(urlStr);
}
