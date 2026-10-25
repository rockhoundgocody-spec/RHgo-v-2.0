/**
 * CrystalNav — bottom 5-tab navigation, dark obsidian style.
 * Clean lucide icons in HUD-cyan / amethyst duotone, refined hero Scan button.
 */
import React from 'react';
import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Home, Map, Gem, Store, ScanLine } from 'lucide-react';
import useKidMode from '@/lib/useKidMode';
import { onboardingStore } from '@/lib/onboardingStore';

const NAV_TABS = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/explore', label: 'Map', Icon: Map },
  { to: '/scan', label: 'Scan', hero: true },
  { to: '/collection', label: 'Collection', Icon: Gem },
  { to: '/market', label: 'Market', Icon: Store },
];

export default function CrystalNav({ activeTab, onTabClick, pathname }) {
  const isKid = useKidMode();
  const onboardingActive = useSyncExternalStore(onboardingStore.subscribe, onboardingStore.get, () => false);
  // Hide the nav entirely during the onboarding/intro cinematic
  if (onboardingActive) return null;
  // Kids don't see the trade/market surface (peer commerce + money).
  const tabs = isKid ? NAV_TABS.filter((t) => t.to !== '/market') : NAV_TABS;
  // Rendered into document.body via portal — escapes the app's internal
  // scroll container so Leaflet's composited map layers can never paint
  // over or hide the nav (iOS WebKit fixed-position bug).
  return createPortal(
    <nav
      aria-label="Primary navigation"
      className="rhgo-crystal-nav fixed left-1/2 z-[5000] flex items-center w-[calc(100%-24px)] max-w-md"
      style={{
        bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        transform: 'translateX(-50%) translateZ(0)',
        willChange: 'transform',
        background: 'linear-gradient(180deg, hsla(250,22%,10%,0.94) 0%, hsla(245,24%,5%,0.98) 100%)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        border: '1px solid hsla(280,40%,55%,0.22)',
        borderRadius: 9999,
        boxShadow:
          'inset 0 1px 0 hsla(280,60%,85%,0.1), 0 8px 40px hsla(250,60%,4%,0.75), 0 0 28px -10px hsla(280,90%,50%,0.35)',
        padding: '8px 10px',
        gap: 4,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.to === '/'
          ? pathname === '/'
          : pathname.startsWith(tab.to);

        if (tab.hero) {
          return (
            <HeroScanButton
              key={tab.to}
              isActive={isActive}
              onClick={() => onTabClick(tab.to, isActive)}
            />
          );
        }

        const Icon = tab.Icon;
        return (
          <button
            type="button"
            key={tab.to}
            onClick={() => onTabClick(tab.to, isActive)}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex flex-1 min-w-0 flex-col items-center gap-1 px-1 py-2 rounded-2xl transition-colors select-none min-h-[56px] justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50 ${isActive ? 'bg-hud-cyan/15 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            aria-label={tab.label}
          >
            <div style={{ filter: isActive ? 'drop-shadow(0 0 6px hsla(195,100%,60%,0.6))' : 'none' }}>
              <Icon size={19} strokeWidth={isActive ? 2 : 1.6} />
            </div>
            <span className={`text-[11px] leading-4 whitespace-nowrap ${isActive ? 'font-bold' : 'font-medium'}`}>
              {tab.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute bottom-0.5 w-5 h-0.5 rounded-full bg-hud-cyan"
              />
            )}
          </button>
        );
      })}
    </nav>,
    document.body
  );
}

function HeroScanButton({ isActive, onClick }) {
  return (
    <div className="flex flex-1 min-w-0 flex-col items-center gap-1 -mt-6 px-1 select-none">
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.92 }}
        className="relative flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
        style={{
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: 'linear-gradient(160deg, hsl(250 18% 14%) 0%, hsl(248 22% 7%) 100%)',
          border: isActive
            ? '1.5px solid hsla(280,90%,75%,0.75)'
            : '1.5px solid hsla(265,40%,55%,0.4)',
          boxShadow: isActive
            ? '0 0 24px hsla(280,90%,65%,0.4), inset 0 1px 0 hsla(260,60%,85%,0.12)'
            : '0 6px 24px hsla(250,60%,4%,0.7), inset 0 1px 0 hsla(260,60%,85%,0.1)',
        }}
        aria-label="Scan"
        aria-current={isActive ? 'page' : undefined}
      >
        <ScanLine
          size={24}
          strokeWidth={1.75}
          style={{ color: isActive ? 'hsl(280,100%,88%)' : 'hsla(270,60%,85%,0.85)' }}
        />
      </motion.button>
      <span className={`text-[11px] leading-4 ${isActive ? 'font-bold text-foreground border-b-2 border-hud-cyan' : 'font-medium text-muted-foreground'}`}>
        Scan
      </span>
    </div>
  );
}