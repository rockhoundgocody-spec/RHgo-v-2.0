import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gem, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { readGuestSpecimens } from '@/lib/useEntityQuery';

const MONTHLY_GOAL = 15;

function getMonthBounds() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const monthStartDate = `${year}-${month}-01`;
  const monthLabel = now.toLocaleString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
  return { monthStartDate, monthLabel };
}

function countGuestThisMonth(monthStartDate) {
  return readGuestSpecimens().filter((s) => {
    const d = (s.found_date || s.created_date || '').slice(0, 10);
    return d >= monthStartDate;
  }).length;
}

export default function MonthlyMineralsHud({ user }) {
  const [{ monthStartDate, monthLabel }] = useState(getMonthBounds);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadCount = async () => {
      try {
        if (user?.email) {
          const total = await base44.entities.Specimen.count({
            found_date: { $gte: monthStartDate },
          });
          if (!cancelled) setCount(Number(total) || 0);
        } else {
          if (!cancelled) setCount(countGuestThisMonth(monthStartDate));
        }
      } catch {
        if (!cancelled) setCount(countGuestThisMonth(monthStartDate));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCount();

    const unsubscribe = base44.entities.Specimen.subscribe(() => {
      loadCount();
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [user?.email, monthStartDate]);

  const pct = Math.min(100, Math.round((count / MONTHLY_GOAL) * 100));

  return (
    <Link
      to="/collection"
      aria-label={`Monthly minerals identified: ${count} of ${MONTHLY_GOAL}. Open GeoDex collection.`}
      className="group relative block w-full max-w-[336px] rounded-2xl hud-panel hud-grid-bg px-4 py-3 transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan"
    >
      {/* Sleek HUD corner brackets */}
      <span className="pointer-events-none absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t border-l border-hud-cyan/70 rounded-tl-[4px]" />
      <span className="pointer-events-none absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t border-r border-hud-cyan/70 rounded-tr-[4px]" />
      <span className="pointer-events-none absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b border-l border-hud-cyan/70 rounded-bl-[4px]" />
      <span className="pointer-events-none absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b border-r border-hud-cyan/70 rounded-br-[4px]" />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-hud-cyan/10 border border-hud-cyan/40 text-hud">
            <Gem size={15} className="drop-shadow-[0_0_6px_hsla(188,100%,75%,0.8)]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-hud glow-hud">
                Monthly IDs
              </span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-hud-blue/70">
                · {monthLabel}
              </span>
            </div>
            <p className="text-xs text-foreground/80 truncate mt-0.5">
              {loading ? 'Syncing telemetry…' : `${count} ${count === 1 ? 'mineral' : 'minerals'} identified`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="text-right">
            <span className="text-lg font-black font-mono tabular-nums text-hud glow-hud">
              {loading ? '—' : count}
            </span>
            <span className="text-[10px] font-mono text-hud-blue/60">/{MONTHLY_GOAL}</span>
          </div>
          <ChevronRight size={14} className="text-hud-cyan/60 group-hover:translate-x-0.5 group-hover:text-hud transition-transform" />
        </div>
      </div>

      {/* Segmented blue HUD progress bar */}
      <div className="mt-2.5 flex items-center gap-2">
        <div className="relative flex-1 h-1.5 rounded-full bg-hud-grid/40 overflow-hidden border border-hud-cyan/25">
          <div
            className="h-full rounded-full bg-gradient-to-r from-hud-blue to-hud-cyan transition-all duration-500"
            style={{
              width: `${pct}%`,
              boxShadow: '0 0 10px hsl(var(--hud-cyan))',
            }}
          />
        </div>
        <span className="text-[10px] font-mono tabular-nums text-hud-cyan/80 w-8 text-right">
          {pct}%
        </span>
      </div>
    </Link>
  );
}