import React, { useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
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
import FeatureGate from '@/components/progression/FeatureGate.jsx';

const PRIMARY_ROOTS = ['/', '/explore', '/scan', '/collection', '/market'];

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

function MainContent({ isAdminOrDocs, isFullscreenMap, pathname }) {
  const gatedOutlet = isAdminOrDocs ? <Outlet /> : (
    <FeatureGate pathname={pathname}>
      <Outlet />
    </FeatureGate>
  );

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
        gatedOutlet
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            {gatedOutlet}
          </motion.div>
        </AnimatePresence>
      )}
    </main>
  );
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  useSeoRobots(false);

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
      navigate(to);
    }
  };

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
        />

        {!isAdminOrDocs && isAuthenticated && !isFullscreenCamera && (
          <CrystalNav activeTab={activeTab} onTabClick={handleTabClick} pathname={location.pathname} />
        )}

        {!isFullscreenCamera && <HotspotProximityWatcher />}
        {!isFullscreenCamera && <StreakReminderBanner />}
        {!isFullscreenCamera && <OracleOverlays />}
        <BadgeUnlockWatcher />
        {!isFullscreenCamera && <FloatingCloverCompanion />}
      </div>
      </BadgeAwarderProvider>
    </OracleProvider>
  );
}

function OracleOverlays() {
  const { autoLive } = useOracle();
  return autoLive ? <OracleLiveOverlay /> : <OracleOverlay />;
}
