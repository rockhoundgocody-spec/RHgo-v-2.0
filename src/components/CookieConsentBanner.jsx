import React, { useEffect, useState } from 'react';
import { Cookie, X } from 'lucide-react';
import { hasConsentChoice, setConsentGranted, setConsentDeclined, subscribe } from '@/lib/cookieConsent';
import { enableAnalytics } from '@/lib/analytics';

/**
 * Renders a cookie consent banner only when no choice has been saved.
 * On accept: persists 'granted' and activates GA/GTM.
 * On decline: persists 'declined' — no analytics scripts ever load.
 * The choice persists in localStorage so the banner never reappears.
 */
export default function CookieConsentBanner() {
  const [show, setShow] = useState(!hasConsentChoice());

  useEffect(() => {
    const unsub = subscribe(() => setShow(false));
    return unsub;
  }, []);

  const handleAccept = () => {
    setConsentGranted();
    enableAnalytics();
  };

  const handleDecline = () => {
    setConsentDeclined();
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[9999] flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pointer-events-none"
    >
      <div className="pointer-events-auto max-w-md w-full rounded-2xl border border-[rgba(159,232,208,0.22)] bg-[rgba(17,16,25,0.96)] backdrop-blur-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <Cookie className="w-5 h-5 mt-0.5 text-[#9FE8D0] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] leading-snug text-[#E8EEF2]">
              We use cookies for anonymous traffic analytics to improve the field
              kit. No specimen locations or personal data are ever shared.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleAccept}
                className="flex-1 min-h-10 rounded-full font-bold text-[12px] text-[#04140e]"
                style={{ background: 'linear-gradient(180deg,#2EE6A6,#1DBF7A)' }}
              >
                Accept
              </button>
              <button
                type="button"
                onClick={handleDecline}
                className="flex-1 min-h-10 rounded-full font-semibold text-[12px] text-[#9AA8B0] border border-[rgba(232,238,242,0.14)]"
              >
                Decline
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDecline}
            aria-label="Dismiss"
            className="shrink-0 p-1 text-[#5C6B74] hover:text-[#9AA8B0]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}