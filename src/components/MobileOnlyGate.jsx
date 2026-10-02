import React, { useEffect, useState } from 'react';

const DESKTOP_MIN = 900;

/**
 * DesktopShell — on wide viewports, center the field app in a premium
 * phone-frame so Hub / Scan / Collection work on laptop without a hard wall.
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

  return (
    <div
      className="min-h-screen w-full flex items-stretch justify-center relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 70% 50% at 50% 20%, hsla(280,80%,28%,0.28) 0%, transparent 60%), ' +
          'linear-gradient(180deg, hsl(245 24% 7%) 0%, hsl(240 28% 4%) 100%)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 hub-grid opacity-40" aria-hidden />
      <div
        className="relative w-full max-w-[430px] min-h-screen shadow-2xl overflow-hidden desktop-phone-frame"
        style={{
          borderLeft: '1px solid hsla(280,60%,55%,0.18)',
          borderRight: '1px solid hsla(280,60%,55%,0.18)',
          boxShadow:
            '0 0 0 1px hsla(265,40%,50%,0.12), 0 25px 80px -20px hsla(280,80%,20%,0.55), 0 0 120px -40px hsla(190,100%,50%,0.2)',
          background: '#0a0a14',
        }}
      >
        <div
          className="pointer-events-none absolute top-0 inset-x-0 h-7 z-[6000] flex items-center justify-center"
          style={{ background: 'linear-gradient(180deg, hsla(240,20%,6%,0.95), transparent)' }}
          aria-hidden
        >
          <div className="w-20 h-1 rounded-full bg-white/15" />
        </div>
        {children}
      </div>
    </div>
  );
}