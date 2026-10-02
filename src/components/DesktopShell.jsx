import React from 'react';
import DesktopDock from '@/components/nav/DesktopDock';

/**
 * DesktopShell — "Gemological Observational Terminal"
 * On wide viewports, unfolds the app into an elevated dual-tier command deck:
 * a slim telemetry strip above a 3-column workstation (Clover intel | specimen
 * viewport | Geo-DEX log) with a floating crystal capsule dock. The actual
 * app page renders inside the center column; the side panels are decorative
 * HUD chrome that frames the content.
 */
export default function DesktopShell({ children }) {
  return (
    <div className="rhgo-desktop-deck">
      <div className="rhgo-desktop-telemetry">
        <div className="telemetry-left">
          <span className="rhgo-desktop-beacon" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </span>
          <span className="rhgo-desktop-status-dot" aria-hidden />
          <span className="rhgo-desktop-ticks" aria-hidden>
            <i /><i /><i /><i /><i /><i /><i />
          </span>
        </div>
        <div className="telemetry-right">
          <span className="rhgo-desktop-signal" aria-hidden />
          <span className="rhgo-desktop-ticks" aria-hidden>
            <i /><i /><i /><i /><i />
          </span>
          <span className="rhgo-desktop-beacon" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M12 3 4 8l8 13 8-13-8-5Z" />
              <path d="m4 8 16 0M12 3l-2 5 2 13 2-13-2-5Z" />
            </svg>
          </span>
        </div>
      </div>

      <div className="rhgo-desktop-workspace">
        <section className="rhgo-desktop-panel intel" aria-hidden>
          <div className="orb-wrap"><div className="orb" /></div>
          <div className="mini-card" />
          <div className="micro-lines"><i /><i /><i /><i /></div>
          <div className="mini-card" />
          <div className="micro-lines"><i /><i /><i /></div>
          <div className="mini-card" />
          <div className="micro-lines"><i /><i /><i /><i /></div>
          <div className="mini-card" />
        </section>

        <section className="rhgo-desktop-panel center">
          {children}
        </section>

        <section className="rhgo-desktop-panel log" aria-hidden>
          <div className="mini-card" />
          <div className="micro-lines"><i /><i /><i /></div>
          <div className="mini-card" />
          <div className="micro-lines"><i /><i /><i /><i /></div>
          <div className="mini-card" />
          <div className="micro-lines"><i /><i /><i /></div>
          <div className="mini-card" />
          <div className="micro-lines"><i /><i /><i /></div>
          <div className="mini-card" />
        </section>
      </div>

      <div className="rhgo-desktop-dock-wrap">
        <DesktopDock />
      </div>
    </div>
  );
}