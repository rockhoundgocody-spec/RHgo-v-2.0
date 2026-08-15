/**
 * MapLayerPanel — Layer toggle bar for the map.
 * Layers: All Finds | Rare Minerals | Collection Gaps | Reviewed Destinations | Expedition
 */
import React from 'react';
import { Layers, Gem, Package, MapPin, Route } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const LAYERS = [
  { id: 'all',        label: 'All',       icon: Layers,  color: '#94a3b8' },
  { id: 'rare',       label: 'Rare',      icon: Gem,     color: '#a78bfa' },
  { id: 'gaps',       label: 'My Gaps',   icon: Package, color: '#c084fc' },
  { id: 'public',     label: 'Reviewed',  icon: MapPin,  color: '#34d399' },
  { id: 'expedition', label: 'Route',     icon: Route,   color: '#f59e0b' },
];

export default function MapLayerPanel({ activeLayer, onLayerChange }) {
  return (
    <div
      className="flex gap-1.5 overflow-x-auto scrollbar-none px-1 py-1"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {LAYERS.map(layer => {
        const Icon   = layer.icon;
        const active = activeLayer === layer.id;
        return (
          <motion.button
            key={layer.id}
            whileTap={{ scale: 0.92 }}
            onClick={() => onLayerChange(layer.id)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full',
              'text-[10px] font-bold uppercase tracking-widest border transition-all',
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
