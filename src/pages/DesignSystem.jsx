import React from 'react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import HudFrame from '@/components/visuals/HudFrame.jsx';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';
import LiquidGlassShader from '@/components/visuals/LiquidGlassShader.jsx';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap, Lock } from 'lucide-react';

export default function DesignSystem() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-hud glow-hud tracking-wider">DESIGN SYSTEM</h1>
        <p className="text-hud-cyan/60 text-xs uppercase tracking-[0.3em] mt-2">
          Living style guide — liquid glass + HUD
        </p>
      </div>

      {/* Shader showcase */}
      <section>
        <SectionTitle>Liquid Glass Shader (Three.js)</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { hue: 0.78, label: 'Amethyst', sub: 'hue 0.78' },
            { hue: 0.55, label: 'Cyan HUD', sub: 'hue 0.55' },
            { hue: 0.92, label: 'Iridescent', sub: 'hue 0.92' },
          ].map((v) => (
            <div key={v.label} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10">
              <LiquidGlassShader hue={v.hue} />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="text-white font-medium text-sm">{v.label}</div>
                <div className="text-white/50 font-mono text-[10px]">{v.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Orb */}
      <section>
        <SectionTitle>Amethyst Orb</SectionTitle>
        <div className="flex flex-wrap gap-8 items-center">
          <AmethystOrb size={140} label="120" sublabel="finds" />
          <AmethystOrb size={200} label="ROCKHOUND" sublabel="GO" />
          <AmethystOrb size={100} />
        </div>
      </section>

      {/* Glass panels */}
      <section>
        <SectionTitle>Glass Panels</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassPanel>
            <div className="p-6">
              <div className="flex items-center gap-2 text-amethyst-glow mb-2">
                <Sparkles size={16} />
                <span className="text-xs uppercase tracking-[0.3em]">Amethyst Variant</span>
              </div>
              <h3 className="text-white text-xl font-semibold">Hero Panel</h3>
              <p className="text-white/60 text-sm mt-2">
                Used for primary content, collection cards, and emotional moments.
              </p>
            </div>
          </GlassPanel>
          <GlassPanel variant="hud">
            <HudFrame label="HUD Variant">
              <h3 className="text-hud font-semibold tracking-wider glow-hud">SYSTEM PANEL</h3>
              <p className="text-hud-cyan/70 text-sm mt-2 font-mono">
                Used for data, admin, scanners, and instrument-style readouts.
              </p>
            </HudFrame>
          </GlassPanel>
        </div>
      </section>

      {/* Buttons & badges */}
      <section>
        <SectionTitle>Controls</SectionTitle>
        <GlassPanel>
          <div className="p-6 flex flex-wrap gap-3 items-center">
            <Button className="bg-amethyst-deep hover:bg-amethyst text-white border border-amethyst/40">
              <Zap size={14} className="mr-2" /> Primary
            </Button>
            <Button variant="outline" className="border-hud-cyan/50 text-hud hover:bg-hud-cyan/10">
              HUD Action
            </Button>
            <Button variant="ghost" className="text-white/70 hover:bg-white/5">
              Ghost
            </Button>
            <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-amethyst/15 text-amethyst-glow border border-amethyst/30">
              Legendary
            </span>
            <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/30">
              Public
            </span>
            <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-rose-400/10 text-rose-300 border border-rose-400/30">
              <Lock size={10} className="inline mr-1" /> Private
            </span>
          </div>
        </GlassPanel>
      </section>

      {/* Color tokens */}
      <section>
        <SectionTitle>Color Tokens</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['amethyst', 'hsl(270 70% 60%)'],
            ['amethyst-deep', 'hsl(265 80% 35%)'],
            ['amethyst-glow', 'hsl(280 100% 75%)'],
            ['hud-cyan', 'hsl(195 100% 60%)'],
          ].map(([name, val]) => (
            <div key={name} className="rounded-xl border border-white/10 overflow-hidden">
              <div className="h-16" style={{ background: val }} />
              <div className="p-2 bg-black/40">
                <div className="text-white text-xs font-mono">{name}</div>
                <div className="text-white/40 text-[10px]">{val}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const SectionTitle = ({ children }) => (
  <h2 className="text-amethyst/70 text-[10px] uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
    <span className="h-px flex-1 bg-gradient-to-r from-amethyst/40 to-transparent" />
    {children}
    <span className="h-px flex-1 bg-gradient-to-l from-amethyst/40 to-transparent" />
  </h2>
);