/**
 * CrystalNav — V2.5 bottom 5-tab navigation
 * Deep liquid-glass bar, neon crystal icons, big glowing hero Scan button
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Crystal SVG icons — inline so they glow with filter/shadow
function IconHome({ glow }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={glow ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12L12 3l9 9" />
      <path d="M9 21V12h6v9" />
      <path d="M3 12v9h18V12" />
    </svg>
  );
}
function IconMap({ glow }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={glow ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}
function IconGem({ glow }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={glow ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12l4 6-10 13L2 9z" />
      <path d="M2 9h20" />
      <path d="M6 3l4 6m8-6l-4 6" />
    </svg>
  );
}
function IconMarket({ glow }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={glow ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}
// Hero crystal scan icon — diamond shard
function IconCrystalScan({ active }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      {/* outer shard */}
      <path
        d="M14 2L22 10L14 26L6 10Z"
        fill={active ? 'hsla(280,100%,80%,0.35)' : 'hsla(280,80%,60%,0.2)'}
        stroke={active ? 'hsla(280,100%,85%,0.9)' : 'hsla(280,80%,70%,0.7)'}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* inner facet */}
      <path
        d="M14 2L22 10H6Z"
        fill={active ? 'hsla(280,100%,90%,0.45)' : 'hsla(280,80%,80%,0.25)'}
        stroke="none"
      />
      {/* scan line */}
      <line x1="6" y1="14" x2="22" y2="14"
        stroke={active ? 'hsla(195,100%,70%,0.9)' : 'hsla(195,100%,60%,0.5)'}
        strokeWidth="1.5"
        strokeDasharray={active ? '0' : '3 2'}
      />
    </svg>
  );
}

const NAV_TABS = [
  { to: '/', label: 'Home', Icon: IconHome, color: 'cyan' },
  { to: '/explore', label: 'Map', Icon: IconMap, color: 'emerald' },
  { to: '/scan', label: 'Scan', hero: true },
  { to: '/collection', label: 'Geo-DEX', Icon: IconGem, color: 'amethyst' },
  { to: '/market', label: 'Market', Icon: IconMarket, color: 'magenta' },
];

const COLORS = {
  cyan:     { active: 'hsl(195,100%,65%)', glow: 'hsla(195,100%,60%,0.7)', dim: 'hsla(195,80%,50%,0.35)' },
  emerald:  { active: 'hsl(160,80%,55%)',  glow: 'hsla(160,80%,50%,0.7)', dim: 'hsla(160,60%,40%,0.35)' },
  amethyst: { active: 'hsl(280,90%,72%)',  glow: 'hsla(280,100%,65%,0.7)', dim: 'hsla(280,70%,55%,0.35)' },
  magenta:  { active: 'hsl(310,90%,68%)',  glow: 'hsla(310,100%,65%,0.7)', dim: 'hsla(310,70%,50%,0.35)' },
};

export default function CrystalNav({ activeTab, onTabClick, pathname }) {
  const [scanPulse, setScanPulse] = useState(false);

  // Periodic scan button pulse
  useEffect(() => {
    const t = setInterval(() => {
      setScanPulse(true);
      setTimeout(() => setScanPulse(false), 900);
    }, 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <nav
      className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center"
      style={{
        bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        // liquid-glass bar
        background: 'linear-gradient(180deg, hsla(255,30%,12%,0.82) 0%, hsla(245,30%,8%,0.92) 100%)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        border: '1px solid hsla(270,50%,60%,0.22)',
        borderRadius: 9999,
        boxShadow:
          'inset 0 1px 0 hsla(280,100%,85%,0.14), inset 0 -1px 0 hsla(240,40%,5%,0.5), 0 8px 40px hsla(265,80%,20%,0.55), 0 0 0 1px hsla(270,30%,40%,0.08)',
        padding: '8px 10px',
        gap: 4,
      }}
    >
      {NAV_TABS.map((tab) => {
        const isActive = tab.to === '/'
          ? pathname === '/'
          : pathname.startsWith(tab.to);

        if (tab.hero) {
          return (
            <HeroScanButton
              key={tab.to}
              isActive={isActive}
              pulse={scanPulse || isActive}
              onClick={() => onTabClick(tab.to, isActive)}
            />
          );
        }

        const c = COLORS[tab.color];
        return (
          <button
            key={tab.to}
            onClick={() => onTabClick(tab.to, isActive)}
            className="relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-full transition-all select-none min-w-[52px] min-h-[48px] justify-center"
            style={{
              color: isActive ? c.active : 'hsla(260,30%,65%,0.65)',
              background: isActive ? `hsla(0,0%,100%,0.06)` : 'transparent',
              boxShadow: isActive ? `inset 0 0 20px ${c.dim}, 0 0 12px ${c.dim}` : 'none',
            }}
            aria-label={tab.label}
          >
            <div style={{ filter: isActive ? `drop-shadow(0 0 6px ${c.glow})` : 'none' }}>
              <tab.Icon glow={isActive} />
            </div>
            <span
              className="text-[9px] font-bold uppercase tracking-[0.18em]"
              style={{ color: isActive ? c.active : 'hsla(260,20%,55%,0.5)' }}
            >
              {tab.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute bottom-1 w-1 h-1 rounded-full"
                style={{ background: c.active, boxShadow: `0 0 6px ${c.glow}` }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function HeroScanButton({ isActive, pulse, onClick }) {
  return (
    <div className="flex flex-col items-center gap-0.5 -mt-6 px-1 select-none">
      <motion.button
        onClick={onClick}
        animate={pulse
          ? { scale: [1, 1.12, 0.97, 1.06, 1] }
          : { scale: 1 }
        }
        transition={pulse ? { duration: 0.7, ease: 'easeInOut' } : {}}
        whileTap={{ scale: 0.88 }}
        className="relative flex items-center justify-center cursor-pointer"
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: isActive
            ? 'radial-gradient(circle at 38% 32%, hsla(280,100%,75%,0.95), hsla(265,100%,45%,0.98))'
            : 'radial-gradient(circle at 38% 32%, hsla(280,85%,60%,0.9), hsla(265,80%,35%,0.95))',
          border: '2px solid hsla(280,100%,80%,0.55)',
          boxShadow: isActive
            ? '0 0 32px hsla(280,100%,70%,0.85), 0 0 70px hsla(265,90%,55%,0.45), inset 0 2px 0 hsla(290,100%,90%,0.35), inset 0 -2px 4px hsla(260,80%,20%,0.4)'
            : '0 0 20px hsla(280,100%,65%,0.5), 0 0 45px hsla(265,80%,45%,0.25), inset 0 2px 0 hsla(290,100%,90%,0.2)',
        }}
        aria-label="Scan"
      >
        {/* Refraction ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 180deg, hsla(195,100%,70%,0.15) 0deg, transparent 60deg, hsla(310,100%,70%,0.12) 180deg, transparent 240deg, hsla(280,100%,75%,0.18) 360deg)',
          }}
        />
        <IconCrystalScan active={isActive} />
      </motion.button>
      <span
        className="text-[9px] font-black uppercase tracking-[0.22em] mt-0.5"
        style={{
          color: isActive ? 'hsl(280,100%,80%)' : 'hsla(280,70%,65%,0.7)',
          textShadow: isActive ? '0 0 10px hsla(280,100%,70%,0.8)' : 'none',
        }}
      >
        Scan
      </span>
    </div>
  );
}