import React from 'react';
import { Image, MapPin, Layers, FlaskConical, History } from 'lucide-react';

const typeIcon = {
  image:    Image,
  locality: MapPin,
  feature:  Layers,
  test:     FlaskConical,
  history:  History,
};

/**
 * EvidenceList — compact pill row showing what evidence was used in reasoning.
 */
export default function EvidenceList({ evidence = [] }) {
  if (!evidence.length) return null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1.5">Evidence used</div>
      <div className="flex flex-wrap gap-1.5">
        {evidence.slice(0, 8).map((e, i) => {
          const Icon = typeIcon[e.type] || Layers;
          return (
            <div
              key={i}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/65"
              title={e.value}
            >
              <Icon size={10} className="text-amethyst/60" />
              {e.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}