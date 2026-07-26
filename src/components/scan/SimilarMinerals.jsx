import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function SimilarMinerals({ candidates = [], topCandidateId = '' }) {
  const [expanded, setExpanded] = useState(false);

  const similars = candidates.filter((c) => c.mineralId !== topCandidateId).slice(0, 5);

  if (similars.length === 0) return null;

  return (
    <GlassPanel className="p-5">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls="similar-minerals-list"
        className="w-full flex items-center justify-between py-2 mb-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst"
      >
        <span className="text-sm font-bold text-white">Look-Alike Minerals</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div id="similar-minerals-list" className="space-y-2">
          {similars.map((mineral, i) => (
            <div key={i} className="p-3 rounded-lg border border-white/10 bg-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white/80">{mineral.name}</span>
                <span className="text-xs font-mono text-white/40">{Math.round(mineral.confidence)}%</span>
              </div>
              <div className="text-[10px] text-white/50 mb-2">{mineral.scientificName}</div>
              <div className="text-[10px] text-white/40 space-y-0.5">
                <div>
                  <span className="text-white/60">Hardness:</span> {mineral.properties?.hardness || 'N/A'}
                </div>
                <div>
                  <span className="text-white/60">Luster:</span> {mineral.properties?.luster || 'N/A'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}