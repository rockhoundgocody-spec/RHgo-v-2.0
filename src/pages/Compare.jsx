import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, GitCompareArrows, Gem, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import LibraryCompare from '@/components/compare/LibraryCompare.jsx';
import LiveCompare from '@/components/compare/LiveCompare.jsx';

/**
 * Compare — unified comparison page with two modes:
 *   • Library — pick two specimens from your collection
 *   • Live    — split-view your current scan vs a reference mineral
 *
 * Audit R3: /compare-live is now folded in here as a tab. The legacy
 * /compare-live route still works (alias in App.jsx) and lands on the
 * Live tab automatically because it carries scan state.
 */
export default function Compare() {
  const location = useLocation();
  // Default to "live" tab if landed via /compare-live or with scan state.
  const initialTab =
    location.pathname === '/compare-live' || location.state?.scanImageUrl
      ? 'live'
      : 'library';
  const [tab, setTab] = useState(initialTab);

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/collection"
          className="flex items-center gap-1.5 text-amethyst/70 hover:text-amethyst-glow text-sm"
        >
          <ArrowLeft size={16} />
          Collection
        </Link>
        <div className="flex items-center gap-2 text-amethyst/60 text-[10px] uppercase tracking-[0.3em]">
          <GitCompareArrows size={12} />
          Compare
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white tracking-wide text-center mb-1">
        Mineral Compare
      </h1>
      <p className="text-amethyst/60 text-xs uppercase tracking-[0.3em] text-center mb-5">
        Side-by-side analysis
      </p>

      {/* Tab strip */}
      <div className="flex gap-1.5 p-1 mb-5 rounded-full glass-panel">
        <TabButton
          active={tab === 'library'}
          onClick={() => setTab('library')}
          icon={Gem}
          label="Library"
        />
        <TabButton
          active={tab === 'live'}
          onClick={() => setTab('live')}
          icon={Camera}
          label="Live Scan"
        />
      </div>

      {tab === 'library' ? <LibraryCompare /> : <LiveCompare />}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 inline-flex items-center justify-center gap-2 min-h-[40px] px-3 rounded-full text-[11px] font-mono uppercase tracking-[0.25em] transition',
        active
          ? 'bg-amethyst/25 text-white shadow-[inset_0_0_18px_hsla(280,100%,70%,0.35)]'
          : 'text-amethyst/60 hover:text-amethyst-glow'
      )}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}