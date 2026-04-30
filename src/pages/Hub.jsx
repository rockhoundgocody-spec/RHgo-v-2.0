import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ScanLine, Gem, ArrowRight } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';

const tiles = [
  {
    to: '/explore',
    title: 'Explore',
    desc: 'Find legal hotspots near you',
    icon: Compass,
    accent: 'from-amethyst/40 to-amethyst-deep/30',
  },
  {
    to: '/scan',
    title: 'Scan',
    desc: 'AI mineral identification',
    icon: ScanLine,
    accent: 'from-hud-cyan/30 to-hud-blue/20',
  },
  {
    to: '/collection',
    title: 'Collection',
    desc: 'Your finds & achievements',
    icon: Gem,
    accent: 'from-amethyst/40 to-amethyst-deep/40',
  },
];

export default function Hub() {
  return (
    <div className="min-h-screen px-6 pt-12 pb-24 max-w-md mx-auto">
      {/* hero orb */}
      <div className="flex flex-col items-center mb-10">
        <AmethystOrb size={240} label="ROCKHOUND" sublabel="GO" />
        <p className="text-amethyst/70 text-sm tracking-wider mt-6 text-center max-w-xs">
          Discover. Identify. Collect. The field guide for modern rockhounds.
        </p>
      </div>

      {/* nav tiles */}
      <div className="space-y-4">
        {tiles.map(({ to, title, desc, icon: Icon, accent }) => (
          <Link key={to} to={to}>
            <GlassPanel className="group hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-4 p-5">
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center border border-white/10`}
                >
                  <Icon className="text-white" size={26} />
                </div>
                <div className="flex-1">
                  <div className="text-white font-semibold text-lg">{title}</div>
                  <div className="text-white/60 text-sm">{desc}</div>
                </div>
                <ArrowRight className="text-amethyst/60 group-hover:text-amethyst group-hover:translate-x-1 transition" />
              </div>
            </GlassPanel>
          </Link>
        ))}
      </div>

      {/* stats strip */}
      <GlassPanel variant="hud" className="mt-8">
        <div className="grid grid-cols-3 divide-x divide-hud-cyan/20 text-center py-4">
          {[
            { v: '15', l: 'Hotspots' },
            { v: '0', l: 'Specimens' },
            { v: 'Lv 1', l: 'Rank' },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-hud font-mono text-xl glow-hud">{s.v}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-hud-cyan/60 mt-1">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}