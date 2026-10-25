import React, { useEffect, useState } from 'react';
import DesktopShell from '@/components/DesktopShell';

const DESKTOP_MIN = 900;

/**
 * MobileOnlyGate — on wide viewports, wraps the app in the desktop command
 * deck (Gemological Observational Terminal). On mobile, the app renders
 * unframed. OAuth consent pages always render full-width for external clients.
 */
export default function MobileOnlyGate({ children }) {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= DESKTOP_MIN : false,
  );

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= DESKTOP_MIN);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // OAuth consent must render full-width and unframed for external AI clients.
  const isOAuth = typeof window !== 'undefined' && window.location.pathname.startsWith('/oauth');
  if (!isDesktop || isOAuth) return children;

  return <DesktopShell>{children}</DesktopShell>;
}