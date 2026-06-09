/**
 * MapLayerBar — compact toggle strip for map layer selection.
 * Layers: All Finds | Rare | Collection Gaps | Public Only | My Finds
 */
import React from 'react';
import { Globe, Gem, Search, MapPin, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const LAYERS = [
  { id: 'all',     icon: Globe,   label: 'All'     },
  { id: 'rare',    icon: Gem,     label: 'Rare+'   },
  { id: 'gaps',    icon: Search,  label: 'Gaps'    },
  { id: 'public',  icon: MapPin,  label: 'Public'  },
  { id: 'mine',    icon: User,    label: 'Mine'    },
];

const ACTIVE_COLORS = {
  all:    'border-amethyst/60 text-amethyst-glow bg-amethyst/10',
  rare:   'border-sky-400/60 text-sky-300 bg-sky-500/10',
  gaps:   'border-amber-400/60 text-amber-300 bg-amber-500/10',
  public: 'border-emerald-400/60 text-emerald-300 bg-emerald-500/10',
  mine:   'border-hud-cyan/60 text-hud-cyan bg-hud-cyan/10',
};

export default function MapLayerBar({ activeLayer = 'all', onChange }) {
  return (
    <div
      className="flex gap-1.5 px-3 py-2 rounded-2xl overflow-x-auto"
      style={{
        background: 'hsla(240,30%,8%,0.88)',
        border: '1px solid hsla(270,30%,30%,0.3)',
        backdropFilter: 'blur(20px)',
        scrollbarWidth: 'none',
      }}
    >
      {LAYERS.map(({ id, icon: Icon, label }) => {
        const active = activeLayer === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all',
              active ? ACTIVE_COLORS[id] : 'border-white/8 text-white/35 hover:text-white/60 hover:border-white/20'
            )}
          >
            <Icon size={10} />
            {label}
          </button>
        );
      })}
    </div>
  );
}