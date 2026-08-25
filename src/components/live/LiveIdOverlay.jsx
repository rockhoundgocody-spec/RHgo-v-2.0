import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

const RARITY_COLOR = {
  common: '#94a3b8',
  uncommon: '#34d399',
  rare: '#38bdf8',
  legendary: '#a78bfa',
};

/**
 * Floats the latest AI identification (mineral name + confidence) directly
 * over the live video feed. Fades in when a new ID arrives, fades out after
 * a few seconds so the feed stays readable between identifications.
 */
export default function LiveIdOverlay({ identification, autoHideMs = 6000 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!identification) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), autoHideMs);
    return () => clearTimeout(t);
  }, [identification, autoHideMs]);

  if (!identification) return null;

  const name = identification.mineral_name || 'Unknown';
  const confidence = Math.round((identification.confidence || 0) * 100);
  const color = RARITY_COLOR[identification.rarity] || RARITY_COLOR.common;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md transition-all duration-500"
      style={{
        bottom: '12px',
        background: 'hsla(220,40%,5%,0.72)',
        border: `1px solid ${color}66`,
        boxShadow: `0 0 18px ${color}40`,
        opacity: visible ? 1 : 0,
        transform: `translate(-50%, ${visible ? 0 : 8}px)`,
        maxWidth: 'calc(100% - 24px)',
      }}
    >
      <Sparkles size={13} style={{ color }} className="shrink-0" />
      <div className="min-w-0">
        <div className="text-xs font-bold text-white truncate leading-tight">{name}</div>
        <div className="text-[9px] font-mono uppercase tracking-[0.15em] leading-tight" style={{ color }}>
          {identification.rarity || 'common'} · {confidence}% confidence
        </div>
      </div>
    </div>
  );
}