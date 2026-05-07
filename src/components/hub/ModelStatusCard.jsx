import React, { useEffect, useState } from 'react';
import { Cpu, CloudOff, Cloud } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

/**
 * ModelStatusCard — shows the active on-device model version (from the
 * MLModel registry) or a graceful "Cloud AI · Gemini Flash" state when
 * no model is published yet. Read-only; updates on mount.
 */
export default function ModelStatusCard() {
  const [model, setModel] = useState(undefined); // undefined = loading

  useEffect(() => {
    let cancelled = false;
    const fetchWithRetry = async () => {
      const maxRetries = 3;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (cancelled) return;
        try {
          const res = await base44.functions.invoke('getLatestModel', {});
          if (!cancelled) setModel(res?.data?.model || null);
          return;
        } catch {
          if (attempt === maxRetries) {
            if (!cancelled) setModel(null);
            return;
          }
          // Exponential backoff: 1s, 2s, 4s
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
        }
      }
    };
    fetchWithRetry();
    return () => { cancelled = true; };
  }, []);

  if (model === undefined) {
    return (
      <GlassPanel className="p-4 text-center text-amethyst/50 text-xs">
        Checking model registry…
      </GlassPanel>
    );
  }

  const onDevice = !!model?.cdn_url;

  return (
    <GlassPanel className="p-4 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: onDevice ? 'hsla(145,70%,40%,0.15)' : 'hsla(195,100%,50%,0.12)',
          border: `1px solid ${onDevice ? 'hsla(145,70%,55%,0.45)' : 'hsla(195,100%,60%,0.3)'}`,
          boxShadow: onDevice
            ? '0 0 14px hsla(145,70%,50%,0.25)'
            : '0 0 14px hsla(195,100%,55%,0.18)',
        }}
      >
        {onDevice ? (
          <Cpu size={18} className="text-emerald-300" />
        ) : (
          <Cloud size={18} className="text-hud-cyan" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] font-mono uppercase tracking-[0.25em] text-amethyst-glow">
            ID Engine
          </span>
          {onDevice ? (
            <span className="text-[10px] font-mono text-emerald-300">on-device</span>
          ) : (
            <span className="text-[10px] font-mono text-hud-cyan/80">cloud</span>
          )}
        </div>
        <div className="text-[13px] text-white truncate">
          {onDevice ? `Model v${model.version}` : 'Gemini Flash'}
          {onDevice && model.size_mb ? (
            <span className="text-amethyst/50 text-[11px] ml-2">
              · {Number(model.size_mb).toFixed(1)} MB
            </span>
          ) : null}
        </div>
        {!onDevice && (
          <div className="flex items-center gap-1 text-amethyst/50 text-[10px] mt-0.5">
            <CloudOff size={10} />
            <span>No on-device model published yet</span>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}