/**
 * CrystalNav — bottom 5-tab navigation, dark obsidian style.
 * Clean lucide icons in HUD-cyan / amethyst duotone, refined hero Scan button.
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Home, Map, Gem, Store, ScanLine } from 'lucide-react';
import useKidMode from '@/lib/useKidMode';

const NAV_TABS = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/explore', label: 'Map', Icon: Map },
  { to: '/scan', label: 'Scan', hero: true },
  { to: '/collection', label: 'Geo-DEX', Icon: Gem },
  { to: '/market', label: 'Market', Icon: Store },
];

export default function CrystalNav({ activeTab, onTabClick, pathname }) {
  const isKid = useKidMode();
  // Kids don't see the trade/market surface (peer commerce + money).
  const tabs = isKid ? NAV_TABS.filter((t) => t.to !== '/market') : NAV_TABS;
  // Rendered into document.body via portal — escapes the app's internal
  // scroll container so Leaflet's composited map layers can never paint
  // over or hide the nav (iOS WebKit fixed-position bug).
  return createPortal(
    <nav
      className="fixed left-1/2 z-[5000] flex items-center"
      style={{
        bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        transform: 'translateX(-50%) translateZ(0)',
        willChange: 'transform',
        background: 'linear-gradient(180deg, hsla(250,20%,9%,0.92) 0%, hsla(245,22%,5%,0.97) 100%)',
        backdropFilter: 'blur(28px) saturate(140%)',
        WebkitBackdropFilter: 'blur(28px) saturate(140%)',
        border: '1px solid hsla(260,20%,40%,0.25)',
        borderRadius: 9999,
        boxShadow:
          'inset 0 1px 0 hsla(260,40%,80%,0.08), 0 8px 40px hsla(250,60%,4%,0.7)',
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
            key={tab.to}
            onClick={() => onTabClick(tab.to, isActive)}
            className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-full transition-colors select-none min-w-[52px] min-h-[48px] justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan"
            style={{
              color: isActive ? 'hsl(195,100%,75%)' : 'hsla(220,30%,70%,0.55)',
              background: isActive ? 'hsla(195,100%,60%,0.07)' : 'transparent',
            }}
            aria-label={tab.label}
          >
            <div style={{ filter: isActive ? 'drop-shadow(0 0 6px hsla(195,100%,60%,0.6))' : 'none' }}>
              <Icon size={19} strokeWidth={isActive ? 2 : 1.6} />
            </div>
            <span
              className="text-[8px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: isActive ? 'hsla(195,100%,82%,0.95)' : 'hsla(220,25%,65%,0.45)' }}
            >
              {tab.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute bottom-1 w-1 h-1 rounded-full"
                style={{ background: 'hsl(195,100%,70%)', boxShadow: '0 0 8px hsla(195,100%,65%,0.8)' }}
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
    <div className="flex flex-col items-center gap-1 -mt-6 px-1 select-none">
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.92 }}
        className="relative flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
      >
        <ScanLine
          size={24}
          strokeWidth={1.75}
          style={{ color: isActive ? 'hsl(280,100%,88%)' : 'hsla(270,60%,85%,0.85)' }}
        />
      </motion.button>
      <span
        className="text-[8px] font-semibold uppercase tracking-[0.22em]"
        style={{ color: isActive ? 'hsla(0,0%,100%,0.85)' : 'hsla(255,15%,60%,0.5)' }}
      >
        Scan
      </span>
    </div>
  );
}