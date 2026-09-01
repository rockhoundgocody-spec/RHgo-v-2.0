/**
 * MapLayerPanel — Layer toggle bar for the map.
 * Layers: All Finds | Rare Minerals | Collection Gaps | Public Only | Expedition
 */
import React from 'react';
import { Layers, Gem, Package, MapPin, Route, Shield } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const LAYERS = [
  { id: 'all',        label: 'All',       icon: Layers,  color: '#94a3b8' },
  { id: 'rare',       label: 'Rare',      icon: Gem,     color: '#a78bfa' },
  { id: 'gaps',       label: 'My Gaps',   icon: Package, color: '#c084fc' },
  { id: 'public',     label: 'Open',      icon: MapPin,  color: '#34d399' },
  { id: 'land',       label: 'Land',      icon: Shield,  color: '#fbbf24' },
  { id: 'expedition', label: 'Route',     icon: Route,   color: '#f59e0b' },
];

export default function MapLayerPanel({ activeLayer, onLayerChange }) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className="flex gap-1.5 overflow-x-auto scrollbar-none px-1 py-1"
      role="group"
      aria-label="Map layers"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {LAYERS.map(layer => {
        const Icon   = layer.icon;
        const active = activeLayer === layer.id;
        return (
          <motion.button
            key={layer.id}
            whileTap={reducedMotion ? undefined : { scale: 0.92 }}
            onClick={() => onLayerChange(layer.id)}
            aria-pressed={active}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full',
              'text-[10px] font-bold uppercase tracking-widest border transition-all motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
            )}
            style={{
              background: active
                ? `${layer.color}22`
                : 'hsla(240,30%,8%,0.82)',
              border: active
                ? `1px solid ${layer.color}88`
                : '1px solid hsla(270,30%,40%,0.25)',
              color: active ? layer.color : 'rgba(255,255,255,0.45)',
              backdropFilter: 'blur(16px)',
              boxShadow: active ? `0 0 12px ${layer.color}44` : 'none',
            }}
          >
            <Icon size={11} />
            {layer.label}
          </motion.button>
        );
      })}
    </div>
  );
}