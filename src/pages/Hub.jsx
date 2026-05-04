import React from 'react';
import { Compass, ScanLine, Gem, Brain } from 'lucide-react';
import HeroOrb from '@/components/hub/HeroOrb.jsx';
import MissionCard from '@/components/hub/MissionCard.jsx';
import StatStrip from '@/components/hub/StatStrip.jsx';
import TiltContainer from '@/components/hub/TiltContainer.jsx';
import CelestialDial from '@/components/hub/CelestialDial.jsx';
import HubIntro from '@/components/hub/HubIntro.jsx';
import CompanionStatus from '@/components/hub/CompanionStatus.jsx';
import DailyCheckIn from '@/components/hub/DailyCheckIn.jsx';
import EcosystemFooter from '@/components/hub/EcosystemFooter.jsx';
import useCompanion from '@/lib/useCompanion.js';

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
    desc: 'The Amethyst Oracle: field tips, geology, regulations — on demand.',
    icon: Brain,
    accent: 'from-hud-cyan/30 to-amethyst/30',
  },
];

export default function Hub() {
  const { companion, todaysSpecimens, refresh } = useCompanion();
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
        <div className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.5em] text-hud-cyan/80 glow-hud mb-6">
          // Geological Intelligence OS
        </div>

        <HeroOrb companion={companion} todaysSpecimens={todaysSpecimens} />

        <CompanionStatus companion={companion} />

        {/* Title block — gradient backdrop ensures legibility over orb glow */}
        <div className="relative mt-14 w-full">
          <div
            aria-hidden
            className="absolute inset-x-0 -top-8 bottom-0 -z-10 pointer-events-none"
            style={{
              background:
                'radial-gradient(60% 80% at 50% 60%, hsla(240,40%,4%,0.85) 0%, hsla(240,40%,4%,0.5) 55%, transparent 100%)',
            }}
          />
          <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight leading-[1.05]">
            ROCKHOUND
            <span className="text-amethyst glow-amethyst">·</span>
            <span className="text-amethyst glow-amethyst">GO</span>
          </h1>
          <p className="mt-4 max-w-md mx-auto text-white/85 text-[15px] sm:text-base leading-relaxed">
            The field platform for mineral discovery, identification, and collector intelligence.
            <span className="block text-amethyst-glow mt-1.5 text-[14px] sm:text-[15px] font-medium tracking-wide">
              Discover. Identify. Collect.
            </span>
          </p>
        </div>

        <div className="mt-6 flex items-center gap-3 flex-wrap justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-[11px] font-mono uppercase tracking-[0.3em] text-amethyst/90">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Field Systems Online
          </div>
          <CelestialDial />
        </div>
      </section>

      {/* DAILY CHECK-IN — Finch-style mood + intention */}
      <DailyCheckIn companion={companion} onCheckedIn={refresh} />

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
      <section>
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

      <EcosystemFooter />
    </div>
  );
}