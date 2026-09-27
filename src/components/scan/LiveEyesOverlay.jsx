import React, { useMemo } from 'react';
import { ScanLine } from 'lucide-react';
import { describeTop, hintFor } from '@/lib/liveEyes';

const RARITY_COLORS = { common: '#94a3b8', uncommon: '#34d399', rare: '#38bdf8', legendary: '#a78bfa' };
const MINT = '#9FE8D0';

/**
 * LiveEyesOverlay — the live label card on the scanner.
 *
 * Shows the current best guess with a confidence bar, up to two
 * alternates, a coaching hint, and "Lock ID", which hands off to the full
 * identification. Labels dim while the camera points away from the frame
 * they describe, and screen readers hear the best guess when it changes.
 */
export default function LiveEyesOverlay({ eyes, onLock, lockDisabled, onUpgrade }) {
  const { status, candidates = [], quality, reason, meter, stale } = eyes;
  const top = candidates[0];
  const alternates = candidates.slice(1, 3);
  const hint = hintFor({ reason, quality, candidates });
  const pct = top ? Math.round(top.confidence * 100) : 0;
  const color = RARITY_COLORS[top?.rarity] || MINT;

  // Announce when the best guess changes or moves by ten points, not on every frame.
  const topName = top?.name || '';
  const topBucket = top ? Math.round(top.confidence * 10) : 0;
  const topRarity = top?.rarity || '';
  const announcement = useMemo(
    () => (topName ? describeTop([{ name: topName, confidence: topBucket / 10, rarity: topRarity }]) : ''),
    [topName, topBucket, topRarity],
  );

  const left = meter && !meter.paid && typeof meter.used === 'number' && typeof meter.limit === 'number'
    ? Math.max(0, meter.limit - meter.used)
    : null;
  const showUpgrade = reason === 'daily' && meter && !meter.paid && typeof onUpgrade === 'function';
  const paused = status === 'paused';

  return (
    <div
      className="absolute inset-x-0 z-30 flex justify-center px-4 pointer-events-none"
      style={{ top: 'calc(max(env(safe-area-inset-top, 0px), 12px) + 60px)' }}
    >
      <section
        aria-label="Live labels"
        className="w-full max-w-sm rounded-2xl px-4 py-3 pointer-events-auto"
        style={{
          background: 'rgba(10,10,20,0.66)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: `1px solid ${paused ? 'rgba(245,158,11,0.35)' : 'rgba(159,232,208,0.22)'}`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: paused ? '#f59e0b' : MINT }}>
            <span
              aria-hidden="true"
              className={`inline-block w-1.5 h-1.5 rounded-full ${status === 'thinking' ? 'motion-safe:animate-ping' : paused ? '' : 'motion-safe:animate-pulse'}`}
              style={{ background: paused ? '#f59e0b' : MINT }}
            />
            {paused ? 'Live paused' : status === 'thinking' ? 'Looking' : 'Live'}
          </span>
          {left !== null && (
            <span className="ml-auto text-[10px] text-white/55">{left} live {left === 1 ? 'label' : 'labels'} left today</span>
          )}
        </div>

        {top ? (
          <div className="mt-1.5 transition-opacity duration-300" style={{ opacity: stale ? 0.45 : 1 }}>
            <div className="flex items-baseline gap-2 min-w-0">
              <p className="text-white font-semibold text-[17px] leading-tight truncate">{top.name}</p>
              {top.rarity !== 'common' && (
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{top.rarity}</span>
              )}
            </div>
            <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }} aria-hidden="true">
              <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: color }} />
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-white/60">
              <span className="shrink-0">{pct}% sure · preview</span>
              {alternates.length > 0 && (
                <span className="truncate">or {alternates.map((a) => a.name).join(' · ')}</span>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-1.5 text-[13px] text-white/75">
            {status === 'thinking' ? 'Taking a look…' : paused ? 'Tap the shutter for a full ID.' : 'Aim at a specimen and hold steady.'}
          </p>
        )}

        {hint && <p className="mt-2 text-[12px] font-medium" style={{ color: '#fcd34d' }}>{hint}</p>}

        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={onLock}
            disabled={lockDisabled}
            aria-label="Lock ID: run a full identification of this specimen"
            className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold transition active:scale-[0.98] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            style={{ background: MINT, color: '#0a0a14' }}
          >
            <ScanLine size={16} aria-hidden="true" /> Lock ID
          </button>
          {showUpgrade && (
            <button
              type="button"
              onClick={onUpgrade}
              className="h-10 px-3 rounded-xl text-[12px] font-semibold text-white/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}
            >
              More live labels
            </button>
          )}
        </div>

        <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
      </section>
    </div>
  );
}
