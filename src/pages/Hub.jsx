import React, { useState, useEffect, useCallback } from 'react';
import { flushWhenStable } from '@/lib/offlineQueue.js';
import HeroOrb from '@/components/hub/HeroOrb.jsx';
import useCompanion from '@/lib/useCompanion.js';
import CompanionMilestoneToast from '@/components/hub/CompanionMilestoneToast.jsx';
import QuestEngine from '@/components/hub/QuestEngine.jsx';
import LiveStatStrip from '@/components/hub/LiveStatStrip.jsx';
import DailyStreakCard from '@/components/hub/DailyStreakCard.jsx';
import RockStarLeaderboard from '@/components/hub/RockStarLeaderboard.jsx';
import StormWindowBanner from '@/components/hub/StormWindowBanner.jsx';
import PlayerLegend from '@/components/hub/PlayerLegend.jsx';
import MoreSheet from '@/components/hub/MoreSheet.jsx';
import CloverSuggests from '@/components/hub/CloverSuggests.jsx';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Compass, ScanLine, Gem, Sword, Trophy, Lock, Users, Atom, Building2, Grid3x3 } from 'lucide-react';
import { useEntityList } from '@/lib/useEntityQuery.js';
import NewUserTour from '@/components/hub/NewUserTour.jsx';
import AddToHomeScreenPrompt from '@/components/hub/AddToHomeScreenPrompt.jsx';
import IntroCinematic from '@/components/hub/IntroCinematic.jsx';
import OpeningBuffer from '@/components/hub/OpeningBuffer.jsx';
import DeferredSection from '@/components/DeferredSection.jsx';
import { onboardingStore } from '@/lib/onboardingStore';

export default function Hub() {
  const [milestone, setMilestone] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [bufferDone, setBufferDone] = useState(() => sessionStorage.getItem('rhgo_buffer_seen') === '1');
  const [showCinematic, setShowCinematic] = useState(() => !localStorage.getItem('rhgo_intro_seen'));
  const handleMilestone = useCallback((m) => setMilestone(m), []);
  const { companion, todaysSpecimenCount } = useCompanion({ onMilestone: handleMilestone });
  const companionLevel = companion?.level || 1;
  const chronolithUnlocked = companionLevel >= 2;
  const { data: specimens = [] } = useEntityList('Specimen', '-found_date');

  useEffect(() => {
    flushWhenStable();
    base44.auth.me()
      .then((u) => { if (u?.email) setUserEmail(u.email); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    onboardingStore.set(!bufferDone || showCinematic);
  }, [bufferDone, showCinematic]);

  if (!bufferDone) {
    return <OpeningBuffer onDone={() => { sessionStorage.setItem('rhgo_buffer_seen', '1'); setBufferDone(true); }} />;
  }

  if (showCinematic) {
    return <IntroCinematic onDone={() => { localStorage.setItem('rhgo_intro_seen', '1'); setShowCinematic(false); }} />;
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center pb-28 scrollbar-none">

      <NewUserTour />
      <AddToHomeScreenPrompt />
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
          <p className="mt-1 text-white/55 text-[11px] font-light tracking-[0.18em] uppercase">
            Discover · Identify · Collect
          </p>
        </div>

        {/* Quick action buttons */}
        {/* Quick action buttons — 4 primary + More */}
        <div className="mt-6 grid grid-cols-4 gap-2 w-full">
          <QuickAction to="/scan" icon={ScanLine} label="Scan" color="amethyst" />
          <QuickAction to="/explore" icon={Compass} label="Map" color="cyan" />
          <QuickAction to="/collection" icon={Gem} label="GeoDex" color="purple" />
          <QuickAction to="/quests" icon={Sword} label="Quests" color="gold" />
        </div>
        <button
          onClick={() => setMoreOpen(true)}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl transition active:scale-[0.98]"
          style={{
            background: 'linear-gradient(180deg, hsla(255,30%,16%,0.45) 0%, hsla(250,28%,10%,0.6) 100%)',
            border: '1px solid hsla(280,70%,65%,0.15)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Grid3x3 size={15} className="text-white/50" />
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/50">More</span>
        </button>
        <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />

        {/* Family Nature Adventure Spotlight */}
        <Link
          to="/explore?focus=family"
          className="mt-3.5 w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all active:scale-[0.98] group"
          style={{
            background: 'linear-gradient(135deg, hsla(180,60%,14%,0.85) 0%, hsla(245,25%,10%,0.95) 100%)',
            borderColor: 'hsla(185,90%,60%,0.35)',
            boxShadow: '0 8px 24px -4px hsla(185,90%,30%,0.25)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'hsla(185,80%,35%,0.3)', border: '1px solid hsla(185,90%,60%,0.4)' }}
            >
              <Compass size={20} className="text-cyan-300" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                Weekend Family Adventure 🌲
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  HOTSPOTS READY
                </span>
              </div>
              <div className="text-[10px] text-white/60 mt-0.5">
                Tap to explore kid-friendly agate beaches & geode beds near you!
              </div>
            </div>
          </div>
          <span className="text-cyan-300 text-xs font-semibold group-hover:translate-x-1 transition-transform">
            →
          </span>
        </Link>

        {/* CHRONOLITH — the deep investigation portal (gated behind companion level 2+) */}
        {chronolithUnlocked ? (
          <Link to="/chronolith" className="mt-4 w-full flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-[0.98] group"
            style={{
              background: 'linear-gradient(135deg, hsla(270,60%,25%,0.4) 0%, hsla(220,40%,8%,0.7) 100%)',
              border: '1px solid hsla(270,80%,60%,0.3)',
              boxShadow: '0 0 30px -8px hsla(280,80%,50%,0.3), inset 0 1px 0 hsla(270,80%,90%,0.08)',
              backdropFilter: 'blur(12px)',
            }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'hsla(270,70%,40%,0.3)', border: '1px solid hsla(270,80%,60%,0.3)' }}>
              <Atom size={20} className="text-amethyst-glow" style={{ filter: 'drop-shadow(0 0 6px hsla(280,100%,65%,0.5))' }} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-black text-white tracking-tight">CHRONOLITH</div>
              <div className="text-[10px] text-white/45 italic">The planet that remembers — reconstruct how matter became itself</div>
            </div>
            <span className="text-[8px] font-mono uppercase tracking-widest px-2 py-1 rounded-full"
              style={{ background: 'hsla(280,80%,30%,0.3)', color: 'hsl(280,85%,85%)', border: '1px solid hsla(280,80%,50%,0.3)' }}>
              Deep
            </span>
          </Link>
        ) : (
          <div className="mt-4 w-full flex items-center gap-3 p-4 rounded-2xl opacity-60"
            style={{
              background: 'linear-gradient(135deg, hsla(240,30%,12%,0.5) 0%, hsla(220,40%,8%,0.6) 100%)',
              border: '1px solid hsla(255,30%,30%,0.2)',
            }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'hsla(240,30%,20%,0.5)', border: '1px solid hsla(255,30%,30%,0.2)' }}>
              <Lock size={18} className="text-white/30" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-black text-white/50 tracking-tight">CHRONOLITH</div>
              <div className="text-[10px] text-white/30">Reach companion level 2 to unlock deep investigation</div>
            </div>
          </div>
        )}

        {/* Find of the Week CTA */}
        <Link to="/find-of-the-week" className="mt-3 w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all active:scale-[0.98] group"
          style={{
            background: 'linear-gradient(135deg, hsla(45,60%,14%,0.5) 0%, hsla(245,25%,10%,0.7) 100%)',
            border: '1px solid hsla(45,80%,55%,0.25)',
            boxShadow: '0 0 24px -8px hsla(45,80%,50%,0.2)',
          }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'hsla(45,70%,30%,0.3)', border: '1px solid hsla(45,80%,55%,0.3)' }}>
            <Trophy size={18} className="text-amber-300" style={{ filter: 'drop-shadow(0 0 5px hsla(45,100%,60%,0.4))' }} />
          </div>
          <div className="flex-1 text-left">
            <div className="text-xs font-bold text-white tracking-tight">Find of the Week</div>
            <div className="text-[10px] text-white/45">Vote for the best community find — new ballot every week</div>
          </div>
          <span className="text-amethyst-glow text-xs font-semibold group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </section>

      {/* ── DASHBOARD FEED ── trimmed to the core engagement loop */}
      <div className="w-full max-w-md mt-6 px-4 space-y-4 scrollbar-none">

        {/* Player Legend — persistent XP, level, avatar */}
        {userEmail && (
          <DeferredSection minHeight={70}>
            <PlayerLegend userEmail={userEmail} />
          </DeferredSection>
        )}

        {/* Live stats wired to real data */}
        <DeferredSection minHeight={60}>
          <LiveStatStrip />
        </DeferredSection>

        {/* Quests */}
        {userEmail && (
          <DeferredSection minHeight={120}>
            <QuestEngine userEmail={userEmail} />
          </DeferredSection>
        )}

        {/* Clover suggests — personalized hunt-next recommendations */}
        <DeferredSection minHeight={100}>
          <CloverSuggests />
        </DeferredSection>

        {/* Mystery mineral of the day */}
        <DeferredSection minHeight={120}>
          <DailyStreakCard companion={companion} />
        </DeferredSection>

        {/* Rock Star leaderboard */}
        <DeferredSection minHeight={160}>
          <RockStarLeaderboard
            userFinds={specimens.length}
            userEmail={userEmail || ''}
          />
        </DeferredSection>

      </div>

      <CompanionMilestoneToast notification={milestone} onDismiss={() => setMilestone(null)} />

      {/* ── LEGAL FOOTER ── */}
      <footer className="w-full max-w-md px-6 mt-6 pb-4 flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-4 text-white/35 text-[11px]">
          <Link to="/privacy-policy" className="hover:text-white/70 transition">Privacy Policy</Link>
          <span className="text-white/20">·</span>
          <Link to="/terms" className="hover:text-white/70 transition">Terms of Service</Link>
        </div>
        <p className="text-white/25 text-[10px]">© 2026 RockHound-GO</p>
      </footer>
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
      <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-white/55 transition-colors group-hover:text-white/85">
        {label}
      </span>
    </Link>
  );
}