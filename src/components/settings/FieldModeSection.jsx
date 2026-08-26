import React from 'react';
import { Zap } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import SectionHeader from './SectionHeader.jsx';

export default function FieldModeSection({ offlineMode, onToggle }) {
  return (
    <div className="mb-6">
      <GlassPanel className="p-4">
        <SectionHeader
          icon={Zap}
          iconColor="text-emerald-400"
          title="Field Mode"
          subtitle="Optimised for weak signal and bright outdoor conditions. Keeps scans and maps functional when off-grid."
        />
        <div className="space-y-2 ml-9">
          <label className="flex items-center gap-3 text-sm text-white/60 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={offlineMode}
              onChange={onToggle}
              className="w-4 h-4 rounded border-white/30 accent-amethyst focus-visible:ring-2 focus-visible:ring-amethyst-glow/70"
            />
            Offline mode enabled
          </label>
          <p className="text-xs text-white/30 ml-7 leading-relaxed">
            Field records load from local cache when signal is weak or absent.
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}
