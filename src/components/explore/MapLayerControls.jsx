import React from 'react';
import { Layers, Box, Mountain, Satellite, Map as MapIcon, Activity, Navigation, X, FlaskConical, Grid2X2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPES = [
  { id: 'hybrid', label: 'Hybrid', icon: Layers },
  { id: 'satellite', label: 'Satellite', icon: Satellite },
  { id: 'terrain', label: 'Terrain', icon: Mountain },
  { id: 'roadmap', label: 'Map', icon: MapIcon },
];

function Chip({ active, onClick, icon: Icon, children, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] uppercase tracking-wider border transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50 focus-visible:ring-offset-2 ring-offset-background',
        active
          ? 'bg-hud-cyan/25 border-hud-cyan/60 text-hud glow-hud'
          : 'bg-black/40 border-white/10 text-white/70 hover:text-white hover:border-hud-cyan/40'
      )}
    >
      {Icon && <Icon size={12} />}
      {children}
    </button>
  );
}

export default function MapLayerControls({
  layers,
  onChange,
  canNavigate,
  onNavigate,
  onClearRoute,
}) {
  const set = (patch) => onChange({ ...layers, ...patch });

  return (
    <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2 z-10 pointer-events-none">
      <div className="hud-panel rounded-lg p-2 flex flex-wrap gap-1.5 pointer-events-auto">
        {TYPES.map((t) => (
          <Chip
            key={t.id}
            active={layers.type === t.id}
            onClick={() => set({ type: t.id })}
            icon={t.icon}
          >
            {t.label}
          </Chip>
        ))}
        <div className="w-px bg-hud-cyan/20 mx-1" />
        <Chip
          active={layers.tilt}
          onClick={() => set({ tilt: !layers.tilt })}
          icon={Box}
          title="3D tilt (Satellite/Hybrid only)"
        >
          3D
        </Chip>
      </div>

      <div className="hud-panel rounded-lg p-2 flex flex-wrap gap-1.5 pointer-events-auto">
        <Chip active={layers.blm} onClick={() => set({ blm: !layers.blm })}>
          BLM
        </Chip>
        <Chip active={layers.parcels} onClick={() => set({ parcels: !layers.parcels })}>
          Parcels
        </Chip>
        <Chip active={layers.geology} onClick={() => set({ geology: !layers.geology })} icon={FlaskConical} title="USGS National Geologic Map">
          Geology
        </Chip>
        <Chip active={layers.cluster} onClick={() => set({ cluster: !layers.cluster })} icon={Grid2X2} title="Cluster nearby markers">
          Cluster
        </Chip>
        <Chip active={layers.traffic} onClick={() => set({ traffic: !layers.traffic })} icon={Activity}>
          Live
        </Chip>
      </div>

      {canNavigate && (
        <div className="hud-panel rounded-lg p-2 flex gap-1.5 pointer-events-auto ml-auto">
          <Chip active onClick={onNavigate} icon={Navigation}>
            Route
          </Chip>
          <Chip onClick={onClearRoute} icon={X}>
            Clear
          </Chip>
        </div>
      )}
    </div>
  );
}