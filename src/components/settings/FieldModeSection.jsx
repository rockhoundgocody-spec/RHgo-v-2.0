import React, { useId } from 'react';
import { Zap } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import SectionHeader from './SectionHeader.jsx';

export default function FieldModeSection({ offlineMode, onToggle }) {
  const switchId = useId();

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
          <div className="flex items-center justify-between gap-3 py-1">
            <label
              htmlFor={switchId}
              className="text-sm text-white/80 hover:text-white font-medium cursor-pointer select-none transition-colors"
            >
              Offline mode enabled
            </label>
            <button
              id={switchId}
              type="button"
              role="switch"
              aria-checked={Boolean(offlineMode)}
              aria-label="Offline mode enabled"
              onClick={onToggle}
              className={`relative w-11 h-6 rounded-full shrink-0 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ${
                offlineMode ? 'bg-emerald-400' : 'bg-white/10'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform ${
                  offlineMode ? 'bg-slate-950 translate-x-5' : 'bg-white/70 translate-x-0'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-white/40 leading-relaxed">
            Field records load from local cache when signal is weak or absent.
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}
