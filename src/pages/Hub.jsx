import React, { useState, useEffect, useCallback } from 'react';
import { flushWhenStable } from '@/lib/offlineQueue.js';
import HeroOrb from '@/components/hub/HeroOrb.jsx';
import useCompanion from '@/lib/useCompanion.js';
import CompanionMilestoneToast from '@/components/hub/CompanionMilestoneToast.jsx';
import SpecimenTypeChart from '@/components/hub/SpecimenTypeChart.jsx';
import QuestEngine from '@/components/hub/QuestEngine.jsx';
import LiveStatStrip from '@/components/hub/LiveStatStrip.jsx';
import DailyStreakCard from '@/components/hub/DailyStreakCard.jsx';

import RockStarLeaderboard from '@/components/hub/RockStarLeaderboard.jsx';
import SeasonBanner from '@/components/hub/SeasonBanner.jsx';
import DiscoveryChain from '@/components/hub/DiscoveryChain.jsx';
import GeologicalAtlas from '@/components/hub/GeologicalAtlas.jsx';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Compass, ScanLine, Gem, Sword, Heart, Trophy, Lock, Users } from 'lucide-react';
import { useEntityList } from '@/lib/useEntityQuery.js';
import DiscoveryTrendChart from '@/components/hub/DiscoveryTrendChart.jsx';
import DailyRoulette from '@/components/hub/DailyRoulette.jsx';
import StormWindowBanner from '@/components/hub/StormWindowBanner.jsx';
import CollectionWeightTracker from '@/components/hub/CollectionWeightTracker.jsx';
import CommunityVerificationQueue from '@/components/scan/CommunityVerificationQueue.jsx';
import IntentionRoulette from '@/components/hub/IntentionRoulette.jsx';
import ChaosModeToggle, { useChaosMode } from '@/components/hub/ChaosModeToggle.jsx';
import ARRockBattle from '@/components/hub/ARRockBattle.jsx';
import PlayerLegend from '@/components/hub/PlayerLegend.jsx';
import CompanionProgressDashboard from '@/components/hub/CompanionProgressDashboard.jsx';
import NewUserTour from '@/components/hub/NewUserTour.jsx';
import HelpTip from '@/components/hub/HelpTip.jsx';
import IntroCinematic from '@/components/hub/IntroCinematic.jsx';
import OpeningBuffer from '@/components/hub/OpeningBuffer.jsx';

export default function Hub() {
  const [milestone, setMilestone] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [bufferDone, setBufferDone] = useState(() => sessionStorage.getItem('rhgo_buffer_seen') === '1');
  const [showCinematic, setShowCinematic] = useState(() => !localStorage.getItem('rhgo_intro_seen'));
  const { chaos, toggle: toggleChaos, locked: chaosLocked } = useChaosMode();
  const handleMilestone = useCallback((m) => setMilestone(m), []);
  const { companion, todaysSpecimenCount } = useCompanion({ onMilestone: handleMilestone });
  const { data: specimens = [] } = useEntityList('Specimen', '-found_date');

  useEffect(() => {
    flushWhenStable();
    base44.auth.me()
      .then((u) => { if (u?.email) setUserEmail(u.email); })
      .catch(() => {});
  }, []);

  if (!bufferDone) {
    return <OpeningBuffer onDone={() => { sessionStorage.setItem('rhgo_buffer_seen', '1'); setBufferDone(true); }} />;
  }

  if (showCinematic) {
    return <IntroCinematic onDone={() => { localStorage.setItem('rhgo_intro_seen', '1'); setShowCinematic(false); }} />;
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center pb-28">
      <NewUserTour />
      {/* Storm window alert — weather-based, near Great Lakes beaches */}
      <StormWindowBanner />

      {/* Ambient purple backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[520px] -z-10"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, hsla(280,90%,50%,0.2) 0%, transparent 70%)',
        }}
      />

      {/* ── HERO CENTERPIECE ── */}
      <section className="flex flex-col items-center text-center px-5 pt-4 w-full max-w-md overflow-hidden">
        {/* Chaos / Scholar mode toggle — top right */}
        <div className="w-full flex justify-end mb-2">
          <ChaosModeToggle chaos={chaos} onToggle={toggleChaos} locked={chaosLocked} />
        </div>
        <HeroOrb companion={companion} todaysSpecimens={todaysSpecimenCount} size={141} />

        <div className="mt-3 select-none">
          <span
            className="text-[56px] sm:text-[80px] font-black leading-none text-amethyst-glow glow-amethyst block"
            style={{
              letterSpacing: '-0.02em',
              textShadow:
                '0 0 60px hsla(280,100%,75%,0.7), 0 0 120px hsla(265,80%,50%,0.4)',
            }}
          >
            GO
          </span>
          <p className="mt-1 text-white/40 text-[11px] font-light tracking-[0.18em] uppercase">
            Discover · Identify · Collect
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="mt-6 grid grid-cols-3 gap-2 w-full">
          <QuickAction to="/scan" icon={ScanLine} label="Scan" color="amethyst" />
          <QuickAction to="/explore" icon={Compass} label="Explore" color="cyan" />
          <QuickAction to="/collection" icon={Gem} label="Codex" color="purple" />
          <QuickAction to="/quests" icon={Sword} label="Missions" color="gold" />
          <QuickAction to="/badges" icon={Trophy} label="Badges" color="amber" />
          <QuickAction to="/companion" icon={Heart} label="Clover" color="rose" />
          <QuickAction to="/private-log" icon={Lock} label="My Finds" color="amethyst" />
          <QuickAction to="/community" icon={Users} label="Social" color="cyan" />
        </div>
      </section>

      {/* ── DASHBOARD FEED ── */}
      <div className="w-full max-w-md mt-6 px-4 space-y-4">

        {/* Player Legend — persistent XP, level, avatar */}
        {userEmail && <PlayerLegend userEmail={userEmail} />}

        {/* Live stats wired to real data */}
        <LiveStatStrip />

        {/* Daily discovery trend chart */}
        <DiscoveryTrendChart />

        {/* Michigan annual weight tracker */}
        {userEmail && <CollectionWeightTracker userEmail={userEmail} />}

        {/* Community verification queue */}
        {userEmail && <CommunityVerificationQueue userEmail={userEmail} />}

        {/* Companion Progress Dashboard */}
        <CompanionProgressDashboard companion={companion} />

        {/* Daily Rock Roulette — Chaos mode only */}
        {chaos && <DailyRoulette />}

        {/* Intention Roulette — Randonautica-style wildcard, always visible */}
        <IntentionRoulette />

        {/* AR Rock Battle — always visible */}
        <ARRockBattle />

        {/* Quests */}
        {userEmail && <QuestEngine userEmail={userEmail} />}

        {/* Mystery mineral of the day */}
        <DailyStreakCard companion={companion} />

        {/* Specimen type chart */}
        <SpecimenTypeChart />

        {/* Active geological season */}
        <SeasonBanner />

        {/* Discovery chain / streak */}
        <DiscoveryChain streak={companion?.streak_days || 0} />

        {/* Geological Atlas — community contribution map */}
        <GeologicalAtlas userSpecimens={specimens} />

        {/* Rock Star leaderboard */}
        <RockStarLeaderboard
          userFinds={specimens.length}
          userEmail={userEmail || ''}
        />

      </div>

      <CompanionMilestoneToast notification={milestone} onDismiss={() => setMilestone(null)} />
    </div>
  );
}

const QUICK_ACCENTS = {
  cyan:     { icon: 'hsl(195,100%,78%)', glow: 'hsla(195,100%,60%,0.45)', border: 'hsla(195,90%,60%,0.22)' },
  amethyst: { icon: 'hsl(280,85%,82%)',  glow: 'hsla(280,100%,65%,0.4)',  border: 'hsla(280,70%,65%,0.22)' },
};

function QuickAction({ to, icon: Icon, label, color }) {
  const a = ['cyan', 'amber'].includes(color) ? QUICK_ACCENTS.cyan : QUICK_ACCENTS.amethyst;
  return (
    <Link
      to={to}
      className="group flex flex-col items-center gap-2 py-3.5 rounded-2xl transition-all active:scale-[0.96]"
      style={{
        background: 'linear-gradient(180deg, hsla(255,30%,16%,0.55) 0%, hsla(250,28%,10%,0.7) 100%)',
        border: `1px solid ${a.border}`,
        boxShadow: 'inset 0 1px 0 hsla(270,60%,90%,0.07), 0 4px 16px -8px hsla(260,60%,10%,0.6)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Icon
        size={19}
        strokeWidth={1.5}
        style={{ color: a.icon, filter: `drop-shadow(0 0 5px ${a.glow})` }}
      />
      <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-white/40 transition-colors group-hover:text-white/65">
        {label}
      </span>
    </Link>
  );
}