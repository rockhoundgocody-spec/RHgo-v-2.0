import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { requiredTitleFor } from '@/lib/featureProgression';

/**
 * Goal-gradient nudge: one sentence about the next wing.
 */
export default function NextUnlockNudge({ next, remaining, xpNeededFor }) {
  if (!next) return null;
  const needed = typeof xpNeededFor === 'function' ? xpNeededFor(next.minLevel) : remaining;
  if (!needed) return null;
  const title = requiredTitleFor(next);

  return (
    <Link
      to="/scan"
      className="block rounded-2xl px-4 py-3 mt-8 mx-5"
      style={{
        background: 'hsla(265,40%,12%,0.85)',
        border: '1px solid hsla(280,60%,50%,0.28)',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={12} className="text-amethyst-glow" />
        <span className="text-[10px] uppercase tracking-[0.22em] text-amethyst-glow/80">Almost there</span>
      </div>
      <p className="text-white/80 text-[13px] leading-snug">
        {needed.toLocaleString()} XP to <span className="text-white font-semibold">{next.label}</span>
        <span className="text-white/40"> · {title}</span>
      </p>
    </Link>
  );
}
