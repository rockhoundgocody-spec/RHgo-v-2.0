import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Mountain, Lock, Loader2 } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import HudFrame from '@/components/visuals/HudFrame.jsx';

const landBadge = {
  public: { color: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10', label: 'PUBLIC' },
  blm: { color: 'text-amber-300 border-amber-400/40 bg-amber-400/10', label: 'BLM' },
  forest_service: { color: 'text-lime-300 border-lime-400/40 bg-lime-400/10', label: 'USFS' },
  state_park: { color: 'text-sky-300 border-sky-400/40 bg-sky-400/10', label: 'STATE' },
  private: { color: 'text-rose-300 border-rose-400/40 bg-rose-400/10', label: 'PRIVATE' },
  unknown: { color: 'text-white/50 border-white/20 bg-white/5', label: 'UNKNOWN' },
};

export default function Explore() {
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Hotspot.list().then((d) => {
      setHotspots(d || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white tracking-wide">Explore</h1>
        <p className="text-amethyst/60 text-xs uppercase tracking-[0.3em] mt-1">
          Hotspots near you
        </p>
      </div>

      {/* HUD scanner panel */}
      <GlassPanel variant="hud" className="mb-6">
        <HudFrame label="Region Scan">
          <div className="hud-grid-bg h-32 rounded-md relative overflow-hidden">
            <div
              className="absolute inset-x-0 h-12 bg-gradient-to-b from-hud-cyan/30 to-transparent animate-hud-scan"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-hud text-xs tracking-[0.4em] uppercase glow-hud">
                {loading ? 'SCANNING…' : `${hotspots.length} SITES DETECTED`}
              </div>
            </div>
          </div>
        </HudFrame>
      </GlassPanel>

      {loading ? (
        <div className="flex justify-center py-12 text-amethyst/60">
          <Loader2 className="animate-spin" />
        </div>
      ) : hotspots.length === 0 ? (
        <GlassPanel className="p-8 text-center">
          <Mountain className="mx-auto text-amethyst/50 mb-3" size={36} />
          <p className="text-white/70">No hotspots seeded yet.</p>
          <p className="text-white/40 text-xs mt-2">Visit Admin → Seed Data</p>
        </GlassPanel>
      ) : (
        <div className="space-y-3">
          {hotspots.map((h) => {
            const badge = landBadge[h.land_type] || landBadge.unknown;
            return (
              <GlassPanel key={h.id} className="hover:scale-[1.01] transition-transform">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="text-white font-semibold">{h.name}</div>
                      <div className="text-amethyst/60 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin size={12} /> {h.state || h.country}
                      </div>
                    </div>
                    <div
                      className={`text-[10px] tracking-widest font-mono px-2 py-1 rounded border ${badge.color}`}
                    >
                      {h.land_type === 'private' && <Lock size={10} className="inline mr-1" />}
                      {badge.label}
                    </div>
                  </div>
                  {h.minerals?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {h.minerals.slice(0, 5).map((m) => (
                        <span
                          key={m}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-amethyst/15 text-amethyst-glow border border-amethyst/20"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                  {h.description && (
                    <p className="text-white/60 text-xs mt-3 line-clamp-2">{h.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <span className="text-[10px] uppercase tracking-wider text-white/40">
                      Difficulty: {h.difficulty}
                    </span>
                    <span className="text-[10px] font-mono text-hud-cyan/70">
                      Trust {((h.trust_score || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}