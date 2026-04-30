import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Compass, ScanLine, Gem, Home, Shield, FileCode2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OracleProvider } from '@/components/oracle/OracleContext.jsx';
import FloatingOracleButton from '@/components/oracle/FloatingOracleButton.jsx';
import OracleOverlay from '@/components/oracle/OracleOverlay.jsx';

const navItems = [
  { to: '/', label: 'Hub', icon: Home },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/scan', label: 'Scan', icon: ScanLine },
  { to: '/collection', label: 'Collection', icon: Gem },
];

const secondary = [
  { to: '/admin', label: 'Admin', icon: Shield },
  { to: '/docs', label: 'Docs', icon: FileCode2 },
];

export default function Layout() {
  const location = useLocation();
  const isAdminOrDocs = ['/admin', '/docs', '/design-system'].some((p) =>
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

      <main className={cn('relative', isAdminOrDocs ? 'pb-8' : 'pb-28')}>
        <Outlet />
      </main>

      {!isAdminOrDocs && (
        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 glass-panel rounded-full px-2 py-2 flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-4 py-2 rounded-full transition',
                  isActive
                    ? 'bg-amethyst/30 text-white shadow-[inset_0_0_18px_hsla(280,100%,70%,0.4)]'
                    : 'text-amethyst/60 hover:text-amethyst'
                )
              }
            >
              <Icon size={18} />
              <span className="text-[10px] tracking-wide">{label}</span>
            </NavLink>
          ))}
        </nav>
      )}

      <FloatingOracleButton />
      <OracleOverlay />
    </div>
    </OracleProvider>
  );
}