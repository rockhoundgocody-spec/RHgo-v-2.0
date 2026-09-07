import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ScanLine, Map } from 'lucide-react';
import { requiredTitleFor, xpNeededForLevel } from '@/lib/featureProgression';
import { XP_PER_LEVEL } from '@/lib/leveling';

/**
 * Shown instead of a locked wing. Honest goal-gradient: real XP, real title,
 * no fake countdown. The CTA is always a core-loop action (Scan or Explore).
 */
export default function UnlockTeaser({ feature, xp = 0 }) {
  if (!feature) return null;
  const title = requiredTitleFor(feature);
  const needed = xpNeededForLevel(feature.minLevel, xp);
  const threshold = (feature.minLevel - 1) * XP_PER_LEVEL;
  const progress = threshold <= 0 ? 100 : Math.min(100, Math.round(((xp || 0) / threshold) * 100));

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center" style={{ background: '#0a0a14' }}>
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ border: '1px solid hsla(280,60%,50%,0.35)', background: 'hsla(265,40%,12%,0.9)' }}
      >
        <Lock size={22} className="text-amethyst-glow" />
      </div>
      <p className="text-[10px] uppercase tracking-[0.28em] text-amethyst-glow/80 mb-2">Still sealed</p>
      <h1 className="text-white font-black text-2xl tracking-tight mb-2">{feature.label}</h1>
      <p className="text-white/50 text-sm max-w-xs leading-relaxed mb-6">
        Wakes at <span className="text-amethyst-glow">{title}</span>.
        {needed > 0
          ? ` ${needed.toLocaleString()} XP from a few honest finds.`
          : ' Your next rank opens this wing.'}
      </p>
      <div className="w-full max-w-xs mb-6">
        <div className="flex justify-between text-[9px] uppercase tracking-wider text-white/35 mb-1.5">
          <span>Toward {title}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'hsla(265,40%,20%,0.45)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.max(progress, xp > 0 ? 3 : 0)}%`,
              background: 'linear-gradient(90deg, hsl(265,80%,55%), hsl(280,100%,75%))',
            }}
          />
        </div>
      </div>
      <div className="flex gap-2 w-full max-w-xs">
        <Link
          to="/scan"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-[0.16em]"
          style={{ background: '#9FE8D0', color: '#0a0a14' }}
        >
          <ScanLine size={14} /> Scan
        </Link>
        <Link
          to="/explore"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-[0.16em] text-white/80"
          style={{ border: '1px solid hsla(0,0%,100%,0.15)' }}
        >
          <Map size={14} /> Map
        </Link>
      </div>
      <p className="text-white/30 text-[11px] mt-6 max-w-xs leading-relaxed">
        Crawling a wing after it opens is a first-footing brag — not a timed stunt.
      </p>
    </div>
  );
}
