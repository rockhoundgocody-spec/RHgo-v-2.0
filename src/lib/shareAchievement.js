/**
 * shareAchievement — unified share helper for RockHound-GO.
 * Uses navigator.share on mobile; falls back to clipboard copy on desktop.
 * Returns { method: 'native' | 'clipboard' | 'error' }
 */

const APP_URL = 'https://rhgo.base44.app';

/**
 * Build a standard challenge share payload.
 * @param {object} opts
 * @param {string} opts.rank    - Player's current rank title, e.g. "Crystal Apprentice"
 * @param {number} opts.xp     - Player's current total XP
 * @param {string} [opts.extra] - Optional extra context, e.g. badge name or find count
 */
export function buildSharePayload({ rank, xp, extra } = {}) {
  const rankStr = rank || 'Rockhound';
  const xpStr   = xp != null ? xp.toLocaleString() : '0';
  const extraLine = extra ? `\n${extra}` : '';

  const title = 'RockHound-GO Challenge';
  const text  =
    `🪨 I'm a ${rankStr} on RockHound-GO with ${xpStr} XP! Can you beat my score?${extraLine}\n\nJoin me here:\n${APP_URL}`;
  const url = APP_URL;

  return { title, text, url };
}

/**
 * Execute the share.
 * @param {object} payload - { title, text, url }
 * @returns {Promise<'native'|'clipboard'|'error'>}
 */
export async function executeShare(payload) {
  const { title, text, url } = payload;
  const fullText = `${text}`;

  // Try Web Share API first (mobile Chrome, Safari, etc.)
  if (navigator.share) {
    try {
      await navigator.share({ title, text: fullText, url });
      return 'native';
    } catch (err) {
      // AbortError = user dismissed — treat as success (no error toast)
      if (err?.name === 'AbortError') return 'native';
      // Fall through to clipboard
    }
  }

  // Clipboard fallback
  const clipboardText = `${fullText}`;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(clipboardText);
    } else {
      // Legacy execCommand fallback for older browsers / WebViews
      const ta = document.createElement('textarea');
      ta.value = clipboardText;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    return 'clipboard';
  } catch {
    return 'error';
  }
}

/**
 * All-in-one: build + share + return result string.
 */
export async function shareAchievement(opts) {
  const payload = buildSharePayload(opts);
  return executeShare(payload);
}