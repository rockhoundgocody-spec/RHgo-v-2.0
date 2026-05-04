import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Compass, ScanLine, Gem, Home, Shield, FileCode2, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OracleProvider } from '@/components/oracle/OracleContext.jsx';
import OracleOverlay from '@/components/oracle/OracleOverlay.jsx';
import OracleLiveOverlay from '@/components/oracle/OracleLiveOverlay.jsx';
import { useOracle } from '@/components/oracle/OracleContext.jsx';

const navItems = [
  { to: '/', label: 'Hub', icon: Home },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/scan', label: 'Scan', icon: ScanLine },
  { to: '/collection', label: 'Collection', icon: Gem },
  { to: '/badges', label: 'Badges', icon: Award },
];

const secondary = [
  { to: '/admin', label: 'Admin', icon: Shield },
  { to: '/docs', label: 'Docs', icon: FileCode2 },
];

export default function Layout() {
  const location = useLocation();
  const isAdminOrDocs = ['/admin', '/docs', '/dev'].some((p) =>
    location.pathname.startsWith(p)
  );

  return (
    <OracleProvider>
    <div className="min-h-screen text-foreground">
      {isAdminOrDocs && (
        <header className="sticky top-0 z-40 hud-panel border-b border-hud-cyan/20 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md hud-grid-bg border border-hud-cyan/40" />
            <div>
              <div className="text-sm font-semibold tracking-widest text-hud glow-hud">
                ROCKHOUND-GO
              </div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-hud-cyan/60">
                {location.pathname.replace('/', '') || 'system'}
              </div>
            </div>
          </div>
          <nav className="flex gap-2">
            {secondary.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-wider rounded-md border',
                    isActive
                      ? 'border-hud-cyan/60 text-hud bg-hud-cyan/10 glow-hud'
                      : 'border-hud-cyan/20 text-hud-cyan/60 hover:text-hud hover:border-hud-cyan/40'
                  )
                }
              >
                <Icon size={14} /> {label}
              </NavLink>
            ))}
          </nav>
        </header>
      )}

      <main
        className={cn('relative', isAdminOrDocs ? 'pb-8' : '')}
        style={
          isAdminOrDocs
            ? undefined
            : { paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 0px))' }
        }
      >
        <Outlet />
      </main>

      {!isAdminOrDocs && (
        <nav
          className="fixed left-1/2 -translate-x-1/2 z-50 glass-panel rounded-full px-2 py-2 flex items-center gap-1"
          style={{ bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
        >
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 rounded-full transition min-w-[56px] min-h-[44px] justify-center',
                  isActive
                    ? 'bg-amethyst/30 text-white shadow-[inset_0_0_18px_hsla(280,100%,70%,0.4)]'
                    : 'text-amethyst/60 hover:text-amethyst'
                )
              }
            >
              <Icon size={18} />
              <span className="text-[11px] font-medium tracking-wide">{label}</span>
            </NavLink>
          ))}
        </nav>
      )}

      <OracleOverlays />
    </div>
    </OracleProvider>
  );
}

// Picks live (full-screen, themed) vs chat overlay based on context
function OracleOverlays() {
  const { autoLive } = useOracle();
  return autoLive ? <OracleLiveOverlay /> : <OracleOverlay />;
}