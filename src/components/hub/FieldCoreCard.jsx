import React from 'react';
import { HardDrive, ChevronRight } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

const StatusChip = ({ label, value, alert = false }) => (
  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-mono ${
    alert 
      ? 'bg-amber-500/10 border border-amber-500/25 text-amber-300'
      : 'bg-amethyst/10 border border-amethyst/25 text-amethyst/70'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${alert ? 'bg-amber-400' : 'bg-emerald-400'} ${!alert && 'animate-pulse'}`} />
    <span className="text-white/70">{label}:</span> <span className="font-bold">{value}</span>
  </div>
);

export default function FieldCoreCard({ onOpen }) {
  return (
    <GlassPanel variant="amethyst" className="p-5 cursor-pointer hover:shadow-[0_0_80px_-20px_hsla(280,80%,55%,0.5)] transition-shadow">
      <div
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen();
          }
        }}
        role="button"
        tabIndex={0}
        className="space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow rounded-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-amethyst/15 border border-amethyst/30 flex items-center justify-center shrink-0">
              <HardDrive size={18} className="text-amethyst-glow" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Field Core</div>
              <div className="text-[11px] text-amethyst/60">Portable offline AI command kit</div>
            </div>
          </div>
          <div className="text-[8px] uppercase tracking-[0.25em] px-2 py-1 rounded-full border border-amethyst/30 bg-amethyst/10 text-amethyst/70 font-mono shrink-0">
            Concept
          </div>
        </div>

        {/* Status Chips */}
        <div className="flex flex-wrap gap-2">
          <StatusChip label="Field Pack" value="Ready" />
          <StatusChip label="Local DB" value="Healthy" />
          <StatusChip label="Offline Finds" value="128" />
          <StatusChip label="Pending Sync" value="4" />
          <StatusChip label="Conflicts" value="0" />
        </div>

        {/* Copy */}
        <p className="text-xs text-white/60 leading-relaxed">
          Cache maps, scans, notes, and AI tools for remote zones. Work offline, sync safely later.
        </p>

        {/* CTA */}
        <button
          onClick={onOpen}
          className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-amethyst-deep hover:bg-amethyst border border-amethyst/40 text-white font-semibold text-sm active:scale-[0.98] transition"
        >
          <span>Open Field Core</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </GlassPanel>
  );
}