import React, { useState, useEffect } from 'react';
import { flushWhenStable } from '@/lib/offlineQueue.js';
import { Compass, ScanLine, Gem, Brain } from 'lucide-react';
import HeroOrb from '@/components/hub/HeroOrb.jsx';
import MissionCard from '@/components/hub/MissionCard.jsx';
import StatStrip from '@/components/hub/StatStrip.jsx';
import TiltContainer from '@/components/hub/TiltContainer.jsx';
import CelestialDial from '@/components/hub/CelestialDial.jsx';
import CompanionStatus from '@/components/hub/CompanionStatus.jsx';
import DailyCheckIn from '@/components/hub/DailyCheckIn.jsx';
import EcosystemFooter from '@/components/hub/EcosystemFooter.jsx';
import CompanionMilestoneToast from '@/components/hub/CompanionMilestoneToast.jsx';
import useCompanion from '@/lib/useCompanion.js';
import FieldCommandBar from '@/components/hub/FieldCommandBar.jsx';

const missions = [
  {
    to: '/explore',
    code: 'M-01',
    title: 'Discover',
    desc: 'BLM-aware hotspot maps, terrain overlays, route to legal sites.',
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

  useEffect(() => {
    flushWhenStable();
  }, []);

  return (
    <div className="relative min-h-screen px-5 sm:px-8 pt-10 pb-24 max-w-4xl mx-auto">
      {/* Ambient purple backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[520px] -z-10"
        style={{
          background: 'radial-gradient(60% 50% at 50% 0%, hsla(280,90%,50%,0.2) 0%, transparent 70%)',
        }}
      />

      {/* ── HERO ── */}
      <section className="flex flex-col items-center text-center mb-12">
        <HeroOrb companion={companion} todaysSpecimens={todaysSpecimenCount} />

        <div className="mt-6 select-none">
          <span
            className="text-[80px] sm:text-[100px] font-black leading-none text-amethyst-glow glow-amethyst block"
            style={{ letterSpacing: '-0.02em', textShadow: '0 0 60px hsla(280,100%,75%,0.7), 0 0 120px hsla(265,80%,50%,0.4)' }}
          >
            GO
          </span>
          <p className="mt-2 text-white/50 text-sm font-light tracking-[0.18em] uppercase">
            Discover · Identify · Collect
          </p>
        </div>

        <div className="mt-5 flex items-center gap-3 flex-wrap justify-center">
          <CompanionStatus companion={companion} />
          <CelestialDial />
        </div>
      </section>

      {/* ── FIELD COMMAND ── */}
      <section className="mb-8">
        <FieldCommandBar collectionCount={todaysSpecimenCount} />
      </section>

      {/* ── DAILY CHECK-IN ── */}
      <DailyCheckIn companion={companion} onCheckedIn={refresh} />

      {/* ── MISSION GRID ── */}
      <section className="mt-10 mb-10">
        <SectionLabel>Mission Console</SectionLabel>
        <TiltContainer max={3}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {missions.map((m) => (
              <MissionCard key={m.to} {...m} />
            ))}
          </div>
        </TiltContainer>
      </section>

      {/* ── FIELD TELEMETRY ── */}
      <section className="mb-10">
        <SectionLabel>Field Telemetry</SectionLabel>
        <TiltContainer max={2}>
          <StatStrip />
        </TiltContainer>
      </section>

      <EcosystemFooter />

      <CompanionMilestoneToast notification={milestone} onDismiss={() => setMilestone(null)} />
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-hud-cyan/70">
        {children}
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-hud-cyan/40 to-transparent" />
    </div>
  );
}