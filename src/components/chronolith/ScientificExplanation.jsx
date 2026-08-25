import React from 'react';
import { Microscope } from 'lucide-react';

export default function ScientificExplanation({ scientificExplanation }) {
  if (!scientificExplanation) return null;

  return (
    <div
      className="p-4 rounded-2xl"
      style={{ background: 'hsla(220,40%,5%,0.6)', border: '1px solid hsla(270,20%,25%,0.2)' }}
    >
      <div className="text-[8px] uppercase tracking-widest text-white/30 mb-2 flex items-center gap-1.5">
        <Microscope size={10} /> Scientific Explanation
      </div>
      <p className="text-xs text-white/65 leading-relaxed">{scientificExplanation}</p>
    </div>
  );
}
