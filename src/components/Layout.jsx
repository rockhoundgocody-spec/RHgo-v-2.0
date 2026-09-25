import React, { useEffect } from 'react';
import { Outlet, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Shield, FileCode2, ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { OracleProvider } from '@/components/oracle/OracleContext.jsx';
import OracleOverlay from '@/components/oracle/OracleOverlay.jsx';
import OracleLiveOverlay from '@/components/oracle/OracleLiveOverlay.jsx';
import { useOracle } from '@/components/oracle/OracleContext.jsx';
import HotspotProximityWatcher from '@/components/HotspotProximityWatcher.jsx';
import StreakReminderBanner from '@/components/hub/StreakReminderBanner.jsx';
import { useSeoRobots } from '@/lib/useSeoRobots';
import ProfileDrawer from '@/components/ProfileDrawer.jsx';
import CrystalNav from '@/components/nav/CrystalNav.jsx';
import { BadgeAwarderProvider } from '@/lib/BadgeAwarderContext';
import BadgeUnlockWatcher from '@/components/badges/BadgeUnlockWatcher';
import FloatingCloverCompanion from '@/components/nav/FloatingCloverCompanion.jsx';
import { useAuth } from '@/lib/AuthContext';
import useReducedMotion from '@/lib/useReducedMotion';

const PRIMARY_ROOTS = ['/', '/explore', '/scan', '/collection', '/market'];

// Layout routes a logged-out visitor may view. Everything else under the
// Layout is protected and redirects to /login.
const PUBLIC_LAYOUT_ROUTES = ['/agate-guide', '/live', '/find-of-the-week', '/clubs', '/docs', '/about', '/contact'];
export function isPublicLayoutRoute(pathname) {
  if (pathname === '/') return true;
  return PUBLIC_LAYOUT_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

const secondaryRoutes = [
  { to: '/admin', label: 'Admin', icon: Shield },
  { to: '/docs', label: 'Docs', icon: FileCode2 },
];

const tabStacks = {};

const pageVariants = {
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -18 },
};
const pageTransition = { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] };

export function getActiveTab(pathname) {
  if (pathname === '/') return '/';
  for (const to of ['/explore', '/scan', '/collection', '/market']) {
    if (pathname.startsWith(to)) return to;
  }
  return '/';
}

function AdminHeader({ pathname }) {
  return (
    <header className="sticky top-0 z-40 hud-panel border-b border-hud-cyan/20 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md hud-grid-bg border border-hud-cyan/40" />
        <div>
          <div className="text-sm font-semibold tracking-widest text-hud glow-hud select-none">ROCKHOUND-GO</div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-hud-cyan/60 select-none">
            {pathname.replace('/', '') || 'system'}
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
  );
}

function SubrouteBackButton({ onBack }) {
  return (
    <div
      className="sticky top-0 z-40 px-4 py-2 flex items-center"
      style={{ background: 'hsla(240,20%,4%,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-amethyst-glow hover:text-white transition select-none min-h-[44px] px-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
        aria-label="Go back"
      >
        <ChevronLeft size={22} />
        <span className="text-sm font-medium">Back</span>
      </button>
    </div>
  );
}

function MainContent({ isAdminOrDocs, isFullscreenMap, pathname, reduceMotion }) {
  return (
    <main
      className={cn('relative', isAdminOrDocs ? 'pb-8' : '')}
      style={
        isAdminOrDocs || isFullscreenMap
          ? undefined
          : { paddingBottom: 'calc(116px + env(safe-area-inset-bottom, 0px))' }
      }
    >
      {isFullscreenMap ? (
        /* Leaflet maps break inside AnimatePresence exit transitions —
           render the map route without the animation wrapper so
           navigating away always works. */
        <Outlet />
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            variants={reduceMotion ? undefined : pageVariants}
            initial={reduceMotion ? false : 'initial'}
            animate={reduceMotion ? undefined : 'animate'}
            exit={reduceMotion ? undefined : 'exit'}
            transition={pageTransition}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      )}
    </main>
  );
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, authChecked } = useAuth();
  const reduceMotion = useReducedMotion();
  // Most Layout routes are private. A few marketing/field pages stay indexable.
  const indexableUnderLayout = [
    '/explore', '/clubs', '/find-of-the-week', '/agate-guide', '/live', '/about', '/contact',
  ].some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`));
  useSeoRobots(indexableUnderLayout);

  // Reset the module-level tab back-stacks when the authenticated user
  // changes so a new user never inherits the previous user's navigation history.
  useEffect(() => {
    for (const key of Object.keys(tabStacks)) delete tabStacks[key];
  }, [user?.email]);

  const isAdminOrDocs = ['/admin', '/docs', '/dev'].some((p) =>
    location.pathname.startsWith(p)
  );
  const isRoot = PRIMARY_ROOTS.includes(location.pathname);
  const isFullscreenMap = location.pathname.startsWith('/explore');
  const isFullscreenCamera = location.pathname.startsWith('/scan');
  const activeTab = getActiveTab(location.pathname);

  useEffect(() => {
    if (!tabStacks[activeTab]) tabStacks[activeTab] = [];
    const stack = tabStacks[activeTab];
    if (stack[stack.length - 1] !== location.pathname) stack.push(location.pathname);
  }, [location.pathname, activeTab]);

  const handleTabClick = (to, isActive) => {
    if (isActive) {
      tabStacks[to] = [to];
      navigate(to, { replace: true });
    } else {
      // Always navigate to root of tab — avoids stale stack issues on sub-routes
      navigate(to);
    }
  };

  // Logged-out visitor on a protected route → straight to login (no spinner).
  if (authChecked && !isAuthenticated && !isPublicLayoutRoute(location.pathname)) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?from_url=${encodeURIComponent(from)}`} replace />;
  }

  return (
    <OracleProvider>
      <BadgeAwarderProvider>
      <div className="w-full min-h-screen text-foreground flex flex-col overflow-x-hidden">
        {isAdminOrDocs && <AdminHeader pathname={location.pathname} />}
        {!isAdminOrDocs && !isRoot && <SubrouteBackButton onBack={() => navigate(-1)} />}

        <MainContent
          isAdminOrDocs={isAdminOrDocs}
          isFullscreenMap={isFullscreenMap}
          pathname={location.pathname}
          reduceMotion={reduceMotion}
        />

        {!isAdminOrDocs && isAuthenticated && !isFullscreenCamera && (
          <CrystalNav activeTab={activeTab} onTabClick={handleTabClick} pathname={location.pathname} />
        )}

        {!isFullscreenCamera && isAuthenticated && <HotspotProximityWatcher />}
        {!isFullscreenCamera && isAuthenticated && <StreakReminderBanner />}
        {!isFullscreenCamera && isAuthenticated && <OracleOverlays />}
        {isAuthenticated && <BadgeUnlockWatcher />}
        {!isFullscreenCamera && isAuthenticated && <FloatingCloverCompanion />}
      </div>
      </BadgeAwarderProvider>
    </OracleProvider>
  );
}

function OracleOverlays() {
  const { autoLive } = useOracle();
  return autoLive ? <OracleLiveOverlay /> : <OracleOverlay />;
}