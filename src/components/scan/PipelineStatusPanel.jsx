import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function PipelineStatusPanel({ status = 'running', taskName = '', durationMs = 0 }) {
  const taskLabel = taskName
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const statusConfig = {
    running: {
      icon: Loader2,
      color: 'text-hud-cyan',
      bg: 'bg-hud-cyan/10',
      border: 'border-hud-cyan/25',
      label: 'Analyzing...'
    },
    success: {
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/25',
      label: 'Success'
    },
    low_confidence: {
      icon: AlertCircle,
      color: 'text-amber-300',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/25',
      label: 'Low Confidence'
    },
    failed: {
      icon: AlertCircle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/25',
      label: 'Failed'
    }
  };

  const config = statusConfig[status] || statusConfig.running;
  const Icon = config.icon;

  return (
    <GlassPanel variant="hud" className="p-4">
      <div className="flex items-center gap-3">
        <Icon size={18} className={`${config.color} ${status === 'running' ? 'animate-spin' : ''}`} />
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">{taskLabel}</div>
          <div className="text-xs text-white/50 mt-0.5">{config.label}</div>
        </div>
        {durationMs > 0 && (
          <div className="text-xs font-mono text-white/30">{(durationMs / 1000).toFixed(1)}s</div>
        )}
      </div>
    </GlassPanel>
  );
}