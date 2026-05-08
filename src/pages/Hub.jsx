import React, { useState, useEffect } from 'react';
import { flushWhenStable } from '@/lib/offlineQueue.js';
import { Compass, ScanLine, Gem, Brain } from 'lucide-react';
import HeroOrb from '@/components/hub/HeroOrb.jsx';
import MissionCard from '@/components/hub/MissionCard.jsx';
import StatStrip from '@/components/hub/StatStrip.jsx';
import TiltContainer from '@/components/hub/TiltContainer.jsx';
import CelestialDial from '@/components/hub/CelestialDial.jsx';
import HubIntro from '@/components/hub/HubIntro.jsx';
import CompanionStatus from '@/components/hub/CompanionStatus.jsx';
import DailyCheckIn from '@/components/hub/DailyCheckIn.jsx';
import DailyCompanionSummary from '@/components/hub/DailyCompanionSummary.jsx';
import EcosystemFooter from '@/components/hub/EcosystemFooter.jsx';
import ProgressDashboard from '@/components/hub/ProgressDashboard.jsx';
import ModelStatusCard from '@/components/hub/ModelStatusCard.jsx';
import useCompanion from '@/lib/useCompanion.js';
import FieldCommandBar from '@/components/hub/FieldCommandBar.jsx';
import FieldCoreCard from '@/components/hub/FieldCoreCard.jsx';
import FieldCorePanel from '@/components/hub/FieldCorePanel.jsx';
import CompanionProgressDashboard from '@/components/hub/CompanionProgressDashboard.jsx';
import CompanionMilestoneToast from '@/components/hub/CompanionMilestoneToast.jsx';
import CloverMemoryLog from '@/components/hub/CloverMemoryLog.jsx';

const missions = [
  {
    to: '/explore',
    code: 'M-01',
    title: 'Discover',
    desc: 'BLM-aware hotspot maps, terrain & live overlays, route to legal sites.',
    icon: Compass,
    accent: 'from-amethyst/40 to-amethyst-deep/30',
  },
  {
    to: '/scan',
    code: 'M-02',
    title: 'Identify',
    desc: 'Point your camera. AI mineralogy returns species, rarity, confidence.',
    icon: ScanLine,
    accent: 'from-hud-cyan/30 to-hud-blue/30',
  },
  {
    to: '/collection',
    code: 'M-03',
    title: 'Collect',
    desc: 'A living vault of every find — geo-tagged, ranked, immortalized.',
    icon: Gem,
    accent: 'from-amethyst/40 to-amethyst-deep/40',
  },
  {
    to: '/docs',
    code: 'M-04',
    title: 'Intelligence',
    desc: 'Ask Clover 🍀 Cole: field tips, geology, regulations — on demand.',
    icon: Brain,
    accent: 'from-hud-cyan/30 to-amethyst/30',
  },
];

export default function Hub() {
  const [milestone, setMilestone] = useState(null);
  const { companion, todaysSpecimenCount, refresh } = useCompanion({
    onMilestone: setMilestone,
  });
  const [fieldCoreOpen, setFieldCoreOpen] = useState(false);

  // On open: flush anything waiting to sync, then clear temp junk
  useEffect(() => {
    // 1. Push pending saves to the server; the queue removes them automatically once done
    flushWhenStable();

    // 2. Wipe actual temp/cache junk — NOT the sync queue, auth, memory, or voice prefs
    const JUNK_PREFIXES = ['rh_tile_', 'rh_model_cache_', 'rh_scan_tmp_', 'scan_draft_tmp_'];
    try {
      Object.keys(localStorage).forEach((k) => {
        if (JUNK_PREFIXES.some((p) => k.startsWith(p))) {
          localStorage.removeItem(k);
        }
      });
    } catch {}
  }, []);
  return (
    <div className="relative min-h-screen px-5 sm:px-8 pt-10 pb-24 max-w-5xl mx-auto">
      {/* ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] -z-10 opacity-70"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 20%, hsla(280,90%,50%,0.25) 0%, transparent 70%)',
        }}
      />

      {/* HERO */}
      <section className="flex flex-col items-center text-center mb-16">
        {/* Brand splash — no bubble, no title text, enlarged orb, GO as the hero */}
        <div className="relative flex flex-col items-center">
          {/* Ambient halo backdrop — expands behind the orb */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10"
            style={{
              height: '560px',
              background:
                'radial-gradient(55% 45% at 50% 40%, hsla(280,90%,55%,0.22) 0%, hsla(265,80%,35%,0.12) 50%, transparent 80%)',
            }}
          />

          <HeroOrb companion={companion} todaysSpecimens={todaysSpecimenCount} />

          {/* GO — the single visual CTA, replaces title + button */}
          <div className="relative mt-6 flex flex-col items-center select-none">
            <span
              className="text-[72px] sm:text-[96px] font-black leading-none tracking-tight text-amethyst-glow glow-amethyst"
              style={{ letterSpacing: '-0.02em', textShadow: '0 0 60px hsla(280,100%,75%,0.7), 0 0 120px hsla(265,80%,50%,0.4)' }}
            >
              GO
            </span>
            <p className="mt-2 text-white/60 text-sm sm:text-base font-light tracking-[0.15em] uppercase">
              Discover · Identify · Collect
            </p>
          </div>

          <div className="mt-5 flex items-center gap-3 flex-wrap justify-center">
            <CompanionStatus companion={companion} />
            <CelestialDial />
          </div>

          <CloverMemoryLog />
        </div>
      </section>

      {/* FIELD COMMAND BAR — natural-language goal router */}
      <section className="mb-8">
        <FieldCommandBar collectionCount={todaysSpecimenCount} />
      </section>

      {/* FIELD CORE — portable offline AI command kit */}
      <section className="mb-8">
        <FieldCoreCard onOpen={() => setFieldCoreOpen(true)} />
      </section>

      {/* DAILY CHECK-IN — Finch-style mood + intention */}
      <DailyCheckIn companion={companion} onCheckedIn={refresh} />

      {/* DAILY SUMMARY — mood + XP gained today, 7-day mini history */}
      <section className="mt-6">
        <DailyCompanionSummary companion={companion} />
      </section>

      {/* COMPANION PROGRESS — XP trends + achievements */}
      <section className="mt-6">
        <CompanionProgressDashboard companion={companion} />
      </section>

      {/* INTRO — explains the orb + ring UI */}
      <HubIntro />

      {/* MISSION GRID */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-hud-cyan/70">
            Mission Console
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-hud-cyan/40 to-transparent" />
        </div>

        <TiltContainer max={3}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {missions.map((m) => (
              <MissionCard key={m.to} {...m} />
            ))}
          </div>
        </TiltContainer>
      </section>

      {/* STATS */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-hud-cyan/70">
            Field Telemetry
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-hud-cyan/40 to-transparent" />
        </div>
        <TiltContainer max={2}>
          <StatStrip />
        </TiltContainer>
      </section>

      {/* PROGRESS — specimens vs mission goals (badge-driven) */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-hud-cyan/70">
            Mission Progress
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-hud-cyan/40 to-transparent" />
        </div>
        <ProgressDashboard />
      </section>

      <section className="mt-6">
        <ModelStatusCard />
      </section>

      <EcosystemFooter />

      {/* Field Core Detail Panel */}
      {fieldCoreOpen && <FieldCorePanel onClose={() => setFieldCoreOpen(false)} />}

      {/* Companion milestone toast */}
      <CompanionMilestoneToast notification={milestone} onDismiss={() => setMilestone(null)} />
    </div>
  );
}