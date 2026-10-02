/**
 * GTM + GA4 helpers for rhgo.me.
 *
 * Set in hosting / .env:
 *   VITE_GTM_ID=GTM-XXXXXXX
 *   VITE_GA4_MEASUREMENT_ID=G-XXXXXXXX
 *   VITE_GSC_VERIFICATION=google-site-verification-token
 *
 * GTM is preferred for tags; GA4 can also receive direct events when set.
 */

const GTM_ID = (import.meta.env.VITE_GTM_ID || '').trim();
const GA4_ID = (import.meta.env.VITE_GA4_MEASUREMENT_ID || '').trim();
const GSC_VERIFICATION = (import.meta.env.VITE_GSC_VERIFICATION || '').trim();

let gtmReady = false;
let gaReady = false;

function ensureDataLayer() {
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

/** Install Search Console HTML verification meta if configured. */
export function installSearchConsoleVerification() {
  if (!GSC_VERIFICATION || typeof document === 'undefined') return;
  if (document.querySelector('meta[name="google-site-verification"]')) return;
  const meta = document.createElement('meta');
  meta.name = 'google-site-verification';
  meta.content = GSC_VERIFICATION;
  document.head.appendChild(meta);
}

/** Inject GTM bootstrap once. No-op without VITE_GTM_ID. */
export function installGtm() {
  if (gtmReady || !GTM_ID || typeof document === 'undefined') return;
  if (!/^GTM-[A-Z0-9]+$/i.test(GTM_ID)) {
    console.warn('[analytics] Ignoring invalid VITE_GTM_ID');
    return;
  }
  ensureDataLayer().push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
  document.head.appendChild(script);

  if (!document.getElementById('rhgo-gtm-noscript')) {
    const noscript = document.createElement('noscript');
    noscript.id = 'rhgo-gtm-noscript';
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden" title="gtm"></iframe>`;
    document.body.insertBefore(noscript, document.body.firstChild);
  }
  gtmReady = true;
}

/** Optional direct GA4 gtag when measurement ID is set (also usable via GTM). */
export function installGa4() {
  if (gaReady || !GA4_ID || typeof document === 'undefined') return;
  if (!/^G-[A-Z0-9]+$/i.test(GA4_ID)) {
    console.warn('[analytics] Ignoring invalid VITE_GA4_MEASUREMENT_ID');
    return;
  }
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA4_ID, { send_page_view: false });
  gaReady = true;
}

export function initAnalytics() {
  installSearchConsoleVerification();
  installGtm();
  installGa4();
}

/**
 * SPA page view — call on every React Router location change.
 * Never send emails, tokens, or exact GPS.
 */
export function trackPageView(path, title) {
  const page_path = path || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const page_title = title || (typeof document !== 'undefined' ? document.title : '');
  ensureDataLayer().push({
    event: 'page_view',
    page_path,
    page_title,
  });
  if (typeof window.gtag === 'function' && GA4_ID) {
    window.gtag('event', 'page_view', { page_path, page_title });
  }
}

/** Generic event helper for product analytics. */
export function trackEvent(eventName, params = {}) {
  if (!eventName) return;
  const safe = {};
  for (const [k, v] of Object.entries(params || {})) {
    if (v == null) continue;
    if (typeof v === 'string' && /@|token|password|lat|lng|email/i.test(k)) continue;
    safe[k] = v;
  }
  ensureDataLayer().push({ event: eventName, ...safe });
  if (typeof window.gtag === 'function' && GA4_ID) {
    window.gtag('event', eventName, safe);
  }
}

export const analyticsConfig = {
  gtmId: GTM_ID || null,
  ga4Id: GA4_ID || null,
  gscConfigured: Boolean(GSC_VERIFICATION),
};
