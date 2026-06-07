import React, { useState, useEffect } from 'react';
import { flushWhenStable } from '@/lib/offlineQueue.js';
import HeroOrb from '@/components/hub/HeroOrb.jsx';
import useCompanion from '@/lib/useCompanion.js';
import CompanionMilestoneToast from '@/components/hub/CompanionMilestoneToast.jsx';
import SpecimenTypeChart from '@/components/hub/SpecimenTypeChart.jsx';
import QuestEngine from '@/components/hub/QuestEngine.jsx';
import LiveStatStrip from '@/components/hub/LiveStatStrip.jsx';
import DailyStreakCard from '@/components/hub/DailyStreakCard.jsx';
import TreasureSpawnBanner from '@/components/hub/TreasureSpawnBanner.jsx';
import RockStarLeaderboard from '@/components/hub/RockStarLeaderboard.jsx';
import SeasonBanner from '@/components/hub/SeasonBanner.jsx';
import DiscoveryChain from '@/components/hub/DiscoveryChain.jsx';
import GeologicalAtlas from '@/components/hub/GeologicalAtlas.jsx';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Compass, ScanLine, Gem } from 'lucide-react';
import { useEntityList } from '@/lib/useEntityQuery.js';
import DailyRoulette from '@/components/hub/DailyRoulette.jsx';
import ChaosModeToggle, { useChaosMode } from '@/components/hub/ChaosModeToggle.jsx';

export default function Hub() {
  const [milestone, setMilestone] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const { chaos, toggle: toggleChaos } = useChaosMode();
  const { companion, todaysSpecimenCount } = useCompanion({ onMilestone: setMilestone });
  const { data: specimens = [] } = useEntityList('Specimen', '-found_date');

  useEffect(() => {
    flushWhenStable();
    base44.auth.me()
      .then((u) => { if (u?.email) setUserEmail(u.email); })
      .catch(() => {});
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center pb-28">
      {/* Treasure spawn notification — fires after 4s */}
      <TreasureSpawnBanner />

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
      <section className="flex flex-col items-center text-center px-5 pt-6 w-full max-w-md">
        {/* Chaos / Scholar mode toggle — top right */}
        <div className="w-full flex justify-end mb-2">
          <ChaosModeToggle chaos={chaos} onToggle={toggleChaos} />
        </div>
        <HeroOrb companion={companion} todaysSpecimens={todaysSpecimenCount} />

        <div className="mt-5 select-none">
          <span
            className="text-[72px] sm:text-[96px] font-black leading-none text-amethyst-glow glow-amethyst block"
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
          <QuickAction to="/scan" icon={ScanLine} label="Scan Rock" color="amethyst" />
          <QuickAction to="/explore" icon={Compass} label="Explore" color="cyan" />
          <QuickAction to="/collection" icon={Gem} label="Collection" color="purple" />
        </div>
      </section>

      {/* ── DASHBOARD FEED ── */}
      <div className="w-full max-w-md mt-6 px-4 space-y-4">

        {/* Live stats wired to real data */}
        <LiveStatStrip />

        {/* Daily Rock Roulette — Chaos mode only */}
        {chaos && <DailyRoulette />}

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

function QuickAction({ to, icon: Icon, label, color }) {
  const styles = {
    amethyst: { border: 'border-amethyst/30', bg: 'bg-amethyst/10 hover:bg-amethyst/20', text: 'text-amethyst-glow', glow: 'hsla(280,100%,70%,0.3)' },
    cyan:     { border: 'border-hud-cyan/30',  bg: 'bg-hud-cyan/10 hover:bg-hud-cyan/20',  text: 'text-hud-cyan',    glow: 'hsla(195,100%,60%,0.3)' },
    purple:   { border: 'border-purple-400/30', bg: 'bg-purple-900/20 hover:bg-purple-900/30', text: 'text-purple-300', glow: 'hsla(270,80%,65%,0.3)' },
  };
  const s = styles[color];
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border ${s.border} ${s.bg} transition-all active:scale-95`}
      style={{ boxShadow: `0 0 16px -6px ${s.glow}` }}
    >
      <Icon size={20} className={s.text} />
      <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${s.text}`}>
        {label}
      </span>
    </Link>
  );
}