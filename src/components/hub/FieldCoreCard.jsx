/**
 * FieldCoreCard — Premium system panel for RockHound-GO Field Core
 * Portable offline AI command kit: expedition launch + sync status
 */
import React, { useState } from 'react';
import { HardDrive, Zap, Lock, ChevronRight, Wifi, AlertCircle } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function FieldCoreCard({ onOpen }) {
  const [isHovered, setIsHovered] = useState(false);

  // Mock data — in production, fetch from a FieldCore entity or state
  const offlinePacked = true;
  const syncQueueCount = 4;
  const cloverPackReady = true;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onOpen}
      className="cursor-pointer transition-transform active:scale-[0.98]"
    >
      <GlassPanel
        variant="amethyst"
        className={`p-5 border-l-2 transition-all ${
          isHovered
            ? 'border-l-amethyst-glow shadow-[0_0_40px_-10px_hsla(280,100%,60%,0.5)]'
            : 'border-l-amethyst/30'
        }`}
        glow={isHovered}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-amethyst-glow/70 mb-1">
              Field Core
            </div>
            <h3 className="text-lg font-bold text-white">Portable Offline AI</h3>
            <p className="text-xs text-white/50 mt-1">Command kit for remote zones</p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amethyst-deep/40 border border-amethyst/25 text-[9px] font-mono uppercase tracking-[0.2em] text-amethyst-glow">
            Concept Layer
          </div>
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <StatusChip
            icon={<HardDrive size={11} />}
            label="Offline Pack"
            status={offlinePacked ? 'Ready' : 'Not Cached'}
            color={offlinePacked ? 'emerald' : 'slate'}
          />
          <StatusChip
            icon={syncQueueCount > 0 ? <AlertCircle size={11} /> : <Wifi size={11} />}
            label="Sync Queue"
            status={syncQueueCount > 0 ? `${syncQueueCount} pending` : 'Synced'}
            color={syncQueueCount > 0 ? 'amber' : 'emerald'}
          />
          <StatusChip
            icon={<Zap size={11} />}
            label="Clover Pack"
            status={cloverPackReady ? 'Updated' : 'Updating'}
            color={cloverPackReady ? 'emerald' : 'slate'}
          />
        </div>

        {/* Description + CTA */}
        <p className="text-sm text-white/70 mb-4 leading-relaxed">
          Cache maps, scans, notes, and AI tools for expeditions with little or no signal. Field Core turns
          RockHound-GO into a portable expedition brain.
        </p>

        <button
          className="w-full flex items-center justify-between py-3 px-3 rounded-lg bg-amethyst-deep/50 border border-amethyst/40 text-white text-sm font-semibold hover:bg-amethyst-deep hover:border-amethyst/60 transition group"
          onClick={(e) => {
            e.stopPropagation();
            onOpen?.();
          }}
        >
          <span>Open Field Core</span>
          <ChevronRight size={16} className="group-hover:translate-x-0.5 transition" />
        </button>
      </GlassPanel>
    </div>
  );
}

function StatusChip({ icon, label, status, color = 'slate' }) {
  const colorMap = {
    emerald: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    amber: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    slate: 'bg-slate-500/15 border-slate-500/30 text-slate-300',
  };
  return (
    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-medium ${colorMap[color]}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}