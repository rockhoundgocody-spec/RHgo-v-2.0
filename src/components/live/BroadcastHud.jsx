import React, { useEffect, useState } from 'react';
import { Radio, Activity } from 'lucide-react';

const RARITY_COLOR = {
  common: '#94a3b8',
  uncommon: '#34d399',
  rare: '#38bdf8',
  legendary: '#a78bfa',
};

function formatElapsed(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

/**
 * Subtle HUD overlaid on the broadcaster's live video feed: an on-air pulse
 * with elapsed time (top-left) and the current identification confidence
 * meter (top-right). Stays low-contrast so it never competes with the feed.
 */
export default function BroadcastHud({ stream, lastId }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!stream?.started_at) return;
    const tick = () => setElapsed(Date.now() - new Date(stream.started_at).getTime());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [stream?.started_at]);

  if (!stream) return null;

  const confidence = lastId ? Math.round((lastId.confidence || 0) * 100) : null;
  const color = RARITY_COLOR[lastId?.rarity] || RARITY_COLOR.common;

  return (
    <>
      {/* On-air pulse + elapsed time */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full"
        style={{ background: 'hsla(0,80%,40%,0.55)', backdropFilter: 'blur(6px)' }}>
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
            style={{ background: '#ff5a5a' }} />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#ff7a7a' }} />
        </span>
        <Radio size={9} className="text-white/90" />
        <span className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-white/90">
          {formatElapsed(elapsed)}
        </span>
      </div>

      {/* Confidence meter */}
      {confidence != null && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full"
          style={{ background: 'hsla(220,40%,8%,0.6)', backdropFilter: 'blur(6px)', border: `1px solid ${color}40` }}>
          <Activity size={9} style={{ color }} />
          <div className="flex items-center gap-1">
            <div className="w-10 h-1 rounded-full overflow-hidden" style={{ background: 'hsla(0,0%,100%,0.15)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${confidence}%`, background: color }} />
            </div>
            <span className="text-[9px] font-mono font-bold" style={{ color }}>{confidence}%</span>
          </div>
        </div>
      )}
    </>
  );
}