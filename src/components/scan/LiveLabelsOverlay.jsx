import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

const RARITY_COLORS = {
  common: { fg: 'hsl(0 0% 90%)', bd: 'hsla(0,0%,80%,0.5)', glow: 'hsla(0,0%,80%,0.4)' },
  uncommon: { fg: 'hsl(155 90% 75%)', bd: 'hsla(155,90%,55%,0.6)', glow: 'hsla(155,90%,55%,0.6)' },
  rare: { fg: 'hsl(195 100% 80%)', bd: 'hsla(195,100%,60%,0.6)', glow: 'hsla(195,100%,60%,0.7)' },
  legendary: { fg: 'hsl(280 100% 85%)', bd: 'hsla(280,100%,70%,0.7)', glow: 'hsla(280,100%,60%,0.8)' },
};

/**
 * LiveLabelsOverlay — periodically grabs a frame from the provided <video>
 * ref, uploads it, and asks the quickClassifySpecimen subagent to identify
 * what's in view. Renders floating name + rarity tags over the viewport.
 *
 * Throttled to one classify call every ~6s to keep cost low.
 */
export default function LiveLabelsOverlay({ videoRef, active = true, intervalMs = 6000 }) {
  const [labels, setLabels] = useState([]);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    const grabAndClassify = async () => {
      if (busyRef.current) return;
      const video = videoRef?.current;
      if (!video || video.readyState < 2) return;

      busyRef.current = true;
      try {
        const canvas = document.createElement('canvas');
        const w = 480;
        const h = Math.round((video.videoHeight / video.videoWidth) * w) || 360;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, w, h);
        const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.7));
        if (!blob) return;

        const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const res = await base44.functions.invoke('quickClassifySpecimen', { file_url });
        const cands = res?.data?.candidates || [];
        const filtered = cands.filter((c) => c.confidence > 0.35).slice(0, 3);
        setLabels(filtered);
        // Subtle haptic when a new specimen is detected.
        if (filtered.length && typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate([8, 30, 8]); } catch {}
        }
      } catch {
        // silent — live labels are best-effort
      } finally {
        busyRef.current = false;
      }
    };

    // First call after a short warm-up.
    const warm = setTimeout(grabAndClassify, 1800);
    const id = setInterval(grabAndClassify, intervalMs);
    return () => {
      clearTimeout(warm);
      clearInterval(id);
    };
  }, [videoRef, active, intervalMs]);

  if (!labels.length) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {labels.map((l, i) => {
        const c = RARITY_COLORS[l.rarity] || RARITY_COLORS.common;
        const x = Math.max(0.05, Math.min(0.95, l.x ?? 0.5));
        const y = Math.max(0.05, Math.min(0.95, l.y ?? 0.5));
        return (
          <div
            key={`${l.name}-${i}`}
            className="absolute"
            style={{
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              transform: 'translate(-50%, -50%)',
              animation: 'll-pop 0.5s ease-out',
            }}
          >
            {/* Pin dot */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
              style={{
                background: c.fg,
                boxShadow: `0 0 12px ${c.glow}, 0 0 4px ${c.glow}`,
              }}
            />
            {/* Tether line */}
            <div
              className="absolute left-1/2 top-1/2"
              style={{
                width: 28,
                height: 1,
                background: `linear-gradient(90deg, ${c.bd}, transparent)`,
                transformOrigin: '0 0',
                transform: 'translate(0, -1px) rotate(-30deg)',
              }}
            />
            {/* Floating tag */}
            <div
              className="absolute"
              style={{
                left: 28,
                top: -22,
                padding: '4px 8px',
                borderRadius: 4,
                background: 'hsla(220,40%,5%,0.78)',
                border: `1px solid ${c.bd}`,
                boxShadow: `0 0 14px ${c.glow}`,
                backdropFilter: 'blur(6px)',
                whiteSpace: 'nowrap',
              }}
            >
              <div
                className="text-[8px] font-mono uppercase tracking-[0.3em] opacity-70"
                style={{ color: c.fg }}
              >
                {l.rarity}
              </div>
              <div
                className="text-[11px] font-semibold leading-tight"
                style={{ color: c.fg, textShadow: `0 0 8px ${c.glow}` }}
              >
                {l.name}
              </div>
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes ll-pop {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
}