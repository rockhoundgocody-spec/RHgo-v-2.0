/**
 * DesktopDock — floating crystal capsule dock for the desktop command deck.
 * Mirrors CrystalNav's 5-tab navigation (Home, Map, Scan, Geo-DEX, Market)
 * with the elevated neon-ringed Scan trigger, styled as a wide bottom dock.
 */
import React from 'react';
import { useSyncExternalStore } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Map, Gem, Store, ScanLine } from 'lucide-react';
import useKidMode from '@/lib/useKidMode';
import { onboardingStore } from '@/lib/onboardingStore';

const NAV_TABS = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/explore', label: 'Map', Icon: Map },
  { to: '/scan', label: 'Scan', hero: true, Icon: ScanLine },
  { to: '/collection', label: 'Collection', Icon: Gem },
  { to: '/market', label: 'Market', Icon: Store },
];

export default function DesktopDock() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isKid = useKidMode();
  const onboardingActive = useSyncExternalStore(
    onboardingStore.subscribe,
    onboardingStore.get,
    () => false,
  );
  if (onboardingActive) return null;
  const tabs = isKid ? NAV_TABS.filter((t) => t.to !== '/market') : NAV_TABS;

  const handleTabClick = (to, isActive) => {
    if (isActive) navigate(to, { replace: true });
    else navigate(to);
  };

  return (
    <nav className="rhgo-desktop-dock" aria-label="Primary navigation">
      {tabs.map((tab) => {
        const isActive = tab.to === '/' ? pathname === '/' : pathname.startsWith(tab.to);

        if (tab.hero) {
          return (
            <div key={tab.to} className="rhgo-desktop-scan-slot">
              <button
                type="button"
                className={`rhgo-desktop-scan-button${isActive ? ' current' : ''}`}
                onClick={() => handleTabClick(tab.to, isActive)}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <ScanLine size={27} strokeWidth={1.7} />
              </button>
              <div className="rhgo-desktop-scan-label">{tab.label}</div>
            </div>
          );
        }

        const Icon = tab.Icon;
        return (
          <button
            type="button"
            key={tab.to}
            className={`rhgo-desktop-nav-item${isActive ? ' current' : ''}`}
            onClick={() => handleTabClick(tab.to, isActive)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={21} strokeWidth={1.7} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}