import React from 'react';
import { Glasses, Camera, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const looksLikeGlasses = (label = '') =>
  /glass|cy0|tk80|smart|ai ?cam|xr|meta|ray/i.test(label);

export default function DevicePicker({ devices, selectedId, onSelect, onRefresh, permission, onRequestAccess }) {
  if (permission === 'denied') {
    return (
      <div className="rounded-xl px-4 py-4 text-center" style={{ background: 'hsla(0,60%,20%,0.35)', border: '1px solid hsla(0,70%,60%,0.35)' }}>
        <p className="text-white/80 text-sm font-semibold">Camera access blocked</p>
        <p className="text-white/50 text-xs mt-1">Allow camera permission in your browser settings, then refresh devices.</p>
      </div>
    );
  }

  const needsAccess = devices.length === 0 || devices.every((d) => !d.label);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.22em] text-white/40">Capture source</span>
        <button onClick={onRefresh} className="flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-white/40 hover:text-amethyst-glow">
          <RefreshCw size={10} /> Refresh
        </button>
      </div>

      {needsAccess ? (
        <Button
          onClick={onRequestAccess}
          className="w-full h-11 rounded-xl text-xs font-bold uppercase tracking-[0.18em] text-white"
          style={{ background: 'linear-gradient(135deg, hsla(270,80%,40%,0.9), hsla(280,100%,55%,0.7))' }}
        >
          <Camera size={14} className="mr-2" /> Detect cameras & glasses
        </Button>
      ) : (
        <div className="space-y-1.5">
          {devices.map((d) => {
            const active = d.deviceId === selectedId;
            const glasses = looksLikeGlasses(d.label);
            const Icon = glasses ? Glasses : Camera;
            return (
              <button
                key={d.deviceId}
                onClick={() => onSelect(d.deviceId)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition"
                style={{
                  background: active ? 'hsla(270,60%,30%,0.5)' : 'hsla(220,40%,8%,0.6)',
                  border: `1px solid ${active ? 'hsla(280,100%,70%,0.5)' : 'hsla(0,0%,100%,0.08)'}`,
                }}
              >
                <Icon size={15} style={{ color: active ? 'hsl(280 100% 85%)' : 'hsla(0,0%,100%,0.45)' }} />
                <div className="min-w-0 flex-1">
                  <div className="text-white/90 text-xs font-semibold truncate">
                    {d.label || 'Camera'}
                  </div>
                  {glasses && (
                    <div className="text-[9px] uppercase tracking-[0.18em] text-emerald-300/80">AI glasses detected</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}