import React, { useRef, useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Compass, ScanLine, Gem, Home, Shield, FileCode2, ChevronLeft, Users, Map, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { OracleProvider } from '@/components/oracle/OracleContext.jsx';
import OracleOverlay from '@/components/oracle/OracleOverlay.jsx';
import OracleLiveOverlay from '@/components/oracle/OracleLiveOverlay.jsx';
import { useOracle } from '@/components/oracle/OracleContext.jsx';
import HotspotProximityWatcher from '@/components/HotspotProximityWatcher.jsx';
import ProfileDrawer from '@/components/ProfileDrawer.jsx';

const PRIMARY_ROOTS = ['/', '/explore', '/scan', '/collection', '/market'];

const navItems = [
  { to: '/', label: 'Discover', icon: Home },
  { to: '/explore', label: 'Map', icon: Map },
  { to: '/scan', label: 'Scan', icon: ScanLine, hero: true },
  { to: '/collection', label: 'Geo-DEX', icon: Gem },
  { to: '/quests', label: 'Quests', icon: Sparkles },
];

const secondaryRoutes = [
  { to: '/admin', label: 'Admin', icon: Shield },
  { to: '/docs', label: 'Docs', icon: FileCode2 },
];

// Per-tab navigation stack preservation
const tabStacks = {};

// Quest notification dot — new quests available if last-seen date < today
function useQuestDot() {
  const [hasDot, setHasDot] = useState(() => {
    const seen = localStorage.getItem('rhgo_quests_seen_date');
    return seen !== new Date().toDateString();
  });
  const clearDot = () => {
    localStorage.setItem('rhgo_quests_seen_date', new Date().toDateString());
    setHasDot(false);
  };
  return { hasDot, clearDot };
}

const pageVariants = {
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -18 },
};

const pageTransition = { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] };

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const prevTabRef = useRef(null);
  const { hasDot: questDot, clearDot: clearQuestDot } = useQuestDot();

  const isAdminOrDocs = ['/admin', '/docs', '/dev'].some((p) =>
    location.pathname.startsWith(p)
  );

  const isRoot = PRIMARY_ROOTS.includes(location.pathname);

  // Determine which tab is active
  const activeTab = navItems.find(({ to, label }) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  })?.to || '/';

  // Track stacks per tab
  useEffect(() => {
    if (!tabStacks[activeTab]) tabStacks[activeTab] = [];
    const stack = tabStacks[activeTab];
    if (stack[stack.length - 1] !== location.pathname) {
      stack.push(location.pathname);
    }
  }, [location.pathname, activeTab]);

  const handleTabClick = (to, isActive) => {
    if (to === '/quests') clearQuestDot();
    if (isActive) {
      tabStacks[to] = [to];
      navigate(to, { replace: true });
    } else {
      const stack = tabStacks[to];
      const dest = stack?.length > 0 ? stack[stack.length - 1] : to;
      navigate(dest);
    }
  };

  return (
    <OracleProvider>
      <div className="min-h-screen text-foreground">
        {isAdminOrDocs && (
          <header className="sticky top-0 z-40 hud-panel border-b border-hud-cyan/20 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md hud-grid-bg border border-hud-cyan/40" />
              <div>
                <div className="text-sm font-semibold tracking-widest text-hud glow-hud select-none">
                  ROCKHOUND-GO
                </div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-hud-cyan/60 select-none">
                  {location.pathname.replace('/', '') || 'system'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <nav className="flex gap-2">
                {secondaryRoutes.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-wider rounded-md border select-none',
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
              <div className="w-px h-6 bg-white/10" />
              <ProfileDrawer />
            </div>
          </header>
        )}

        {/* Back button bar for non-root screens in main app */}
        {!isAdminOrDocs && !isRoot && (
          <div className="sticky top-0 z-40 px-4 py-2 flex items-center" style={{ background: 'hsla(240,20%,4%,0.85)', backdropFilter: 'blur(12px)' }}>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-amethyst-glow hover:text-white transition select-none min-h-[44px] px-1"
              aria-label="Go back"
            >
              <ChevronLeft size={22} />
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>
        )}

        <main
          className={cn('relative', isAdminOrDocs ? 'pb-8' : '')}
          style={
            isAdminOrDocs
              ? undefined
              : { paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 0px))' }
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {!isAdminOrDocs && (
          <nav
            className="fixed left-1/2 -translate-x-1/2 z-50 glass-panel rounded-full px-2 py-2 flex items-center gap-1"
            style={{ bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
          >
            {navItems.map(({ to, label, icon: Icon, hero }) => {
              const isActive = to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(to);
              const showDot = to === '/quests' && questDot && !isActive;

              if (hero) {
                return (
                  <button
                    key={to}
                    onClick={() => handleTabClick(to, isActive)}
                    className="relative flex flex-col items-center gap-0.5 -mt-5 px-2 select-none"
                    aria-label={label}
                  >
                    {/* Hero crystal scan button */}
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90"
                      style={{
                        background: isActive
                          ? 'linear-gradient(135deg, hsl(280,80%,55%), hsl(265,90%,40%))'
                          : 'linear-gradient(135deg, hsl(280,70%,45%), hsl(265,80%,30%))',
                        boxShadow: isActive
                          ? '0 0 28px hsla(280,100%,70%,0.7), 0 0 60px hsla(265,80%,50%,0.35), inset 0 1px 0 hsla(280,100%,90%,0.25)'
                          : '0 0 18px hsla(280,100%,70%,0.4), inset 0 1px 0 hsla(280,100%,90%,0.15)',
                        border: '2px solid hsla(280,100%,75%,0.5)',
                      }}
                    >
                      <Icon size={22} className="text-white" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amethyst-glow mt-0.5">{label}</span>
                  </button>
                );
              }

              return (
                <button
                  key={to}
                  onClick={() => handleTabClick(to, isActive)}
                  className={cn(
                    'relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-full transition min-w-[52px] min-h-[44px] justify-center select-none',
                    isActive
                      ? 'bg-amethyst/30 text-white shadow-[inset_0_0_18px_hsla(280,100%,70%,0.4)]'
                      : 'text-amethyst/60 hover:text-amethyst'
                  )}
                  aria-label={label}
                >
                  <div className="relative">
                    <Icon size={18} />
                    {showDot && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-background animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium tracking-wide">{label}</span>
                </button>
              );
            })}
          </nav>
        )}

        <HotspotProximityWatcher />
        <OracleOverlays />
      </div>
    </OracleProvider>
  );
}

function OracleOverlays() {
  const { autoLive } = useOracle();
  return autoLive ? <OracleLiveOverlay /> : <OracleOverlay />;
}