import React from 'react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import { Globe, MapPin, Users, Telescope } from 'lucide-react';
import { useEntityList } from '@/lib/useEntityQuery.js';
import { Link } from 'react-router-dom';

// Community-level stats derived from specimens with GPS
export default function GeologicalAtlas({ userSpecimens = [] }) {
  const { data: allHotspots = [] } = useEntityList('Hotspot', 'name');

  const geoTagged = userSpecimens.filter((s) => s.lat && s.lng).length;
  const uniqueLocations = new Set(
    userSpecimens.filter((s) => s.lat && s.lng)
      .map((s) => `${s.lat?.toFixed(1)},${s.lng?.toFixed(1)}`)
  ).size;

  // Simulate community total (real total would come from an aggregate endpoint)
  const communityFinds = allHotspots.length * 12 + userSpecimens.length * 3 + 847;

  return (
    <Link to="/explore" className="block">
      <GlassPanel variant="hud" className="overflow-hidden group hover:scale-[1.01] transition-transform">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={13} className="text-hud-cyan" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-hud-cyan font-bold glow-hud">
              Geological Atlas
            </span>
            <span className="ml-auto text-[9px] text-hud-cyan/40 group-hover:text-hud-cyan/70 transition flex items-center gap-1">
              Explore map <Telescope size={9} />
            </span>
          </div>

          <p className="text-white/50 text-[10px] leading-relaxed mb-3">
            Every scan you make adds a permanent data point to the world's first
            community-generated youth mineral discovery map.
          </p>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <AtlasCell icon={MapPin} value={geoTagged} label="Your Pins" color="#22d3ee" />
            <AtlasCell icon={Users} value={communityFinds.toLocaleString()} label="Community" color="#a78bfa" />
            <AtlasCell icon={Globe} value={allHotspots.length} label="Hotspots" color="#34d399" />
          </div>

          {geoTagged === 0 ? (
            <div className="text-center py-1">
              <p className="text-[9px] text-white/25 italic">
                Scan a specimen outdoors to place your first pin on the Atlas 🌍
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hud-cyan/8 border border-hud-cyan/20">
              <span className="text-hud-cyan text-[9px] font-bold">
                You are a Contributor.
              </span>
              <span className="text-white/30 text-[9px]">
                {geoTagged} pin{geoTagged !== 1 ? 's' : ''} on the global map.
              </span>
            </div>
          )}
        </div>
      </GlassPanel>
    </Link>
  );
}

function AtlasCell({ icon: Icon, value, label, color }) {
  return (
    <div className="rounded-lg bg-white/3 p-2 text-center">
      <Icon size={11} className="mx-auto mb-1" style={{ color }} />
      <div className="font-mono text-sm font-bold" style={{ color }}>{value}</div>
      <div className="text-[8px] uppercase tracking-wider text-white/30 mt-0.5">{label}</div>
    </div>
  );
}