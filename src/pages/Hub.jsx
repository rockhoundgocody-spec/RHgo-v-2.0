import React from 'react';
import { Compass, ScanLine, Gem, Brain } from 'lucide-react';
import HeroOrb from '@/components/hub/HeroOrb.jsx';
import MissionCard from '@/components/hub/MissionCard.jsx';
import StatStrip from '@/components/hub/StatStrip.jsx';
import TiltContainer from '@/components/hub/TiltContainer.jsx';
import CelestialDial from '@/components/hub/CelestialDial.jsx';

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
        <div className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.5em] text-hud-cyan/70 glow-hud mb-6">
          // Geological Intelligence OS
        </div>

        <HeroOrb />

        <h1 className="mt-12 text-4xl sm:text-6xl font-bold text-white tracking-tight leading-[1.05]">
          ROCKHOUND
          <span className="text-amethyst glow-amethyst">·</span>
          <span className="text-amethyst glow-amethyst">GO</span>
        </h1>
        <p className="mt-4 max-w-md text-white/65 text-sm sm:text-base leading-relaxed">
          The field platform for mineral discovery, identification, and collector intelligence.
          <span className="block text-amethyst/80 mt-1">Discover. Identify. Collect.</span>
        </p>

        <div className="mt-6 flex items-center gap-3 flex-wrap justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-[10px] font-mono uppercase tracking-[0.3em] text-amethyst/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Field Systems Online
          </div>
          <CelestialDial />
        </div>
      </section>

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
    </div>
  );
}