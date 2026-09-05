/**
 * isNativeApp — detect if the app is running inside the Base44 iOS/Android
 * native wrapper (a WebView). Used to gate Stripe checkout for digital
 * subscriptions, which must use StoreKit / Play Billing (not yet available
 * on Base44) rather than Stripe inside the native app.
 *
 * Detection signals:
 * - Android WebView: UA contains "wv)"
 * - iOS WebView: AppleWebKit without "Safari/" and without "CriOS" (Chrome)
 * - Capacitor native bridge
 */
export function isNativeApp() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // Android WebView
  if (/Android/.test(ua) && /wv\)/.test(ua)) return true;
  // iOS WebView (AppleWebKit but not Safari, not Chrome on iOS)
  if (/(iPhone|iPad|iPod)/.test(ua) && /AppleWebKit/.test(ua) && !/Safari\//.test(ua) && !/CriOS/.test(ua)) return true;
  // Capacitor / native bridge
  if (typeof window !== 'undefined' && window.Capacitor?.isNative) return true;
  return false;
}