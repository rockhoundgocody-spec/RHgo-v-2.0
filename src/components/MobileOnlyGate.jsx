import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import DesktopShell from '@/components/DesktopShell';

const DESKTOP_MIN = 900;

/**
 * MobileOnlyGate — on wide viewports, wraps the app in the desktop command
 * deck (Gemological Observational Terminal). On mobile, the app renders
 * unframed. OAuth consent pages always render full-width for external clients.
 */
export default function MobileOnlyGate({ children }) {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= DESKTOP_MIN : false,
  );

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= DESKTOP_MIN);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // OAuth consent must render full-width and unframed for external AI clients.
  const isOAuth = pathname.startsWith('/oauth');
  const isPublicShowcase = pathname === '/demo' || (pathname === '/' && !isAuthenticated);
  if (!isDesktop || isOAuth || isPublicShowcase || pathname === '/scan') return children;

  return <DesktopShell>{children}</DesktopShell>;
}