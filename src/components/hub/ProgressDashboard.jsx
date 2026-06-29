import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  ChevronRight,
  Gem,
  Layers,
  Library,
  Sparkles,
  Crown,
  Hexagon,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { BADGES, computeMetrics } from '@/lib/badgeDefinitions';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

// Explicit map — wildcard imports from lucide-react aren't allowed.
const ICONS = {
  Gem,
  Layers,
  Library,
  Sparkles,
  Crown,
  Hexagon,
  MapPin,
  CheckCircle2,
};

const RARITY_COLOR = {
  common: 'hsl(220 30% 70%)',
  uncommon: 'hsl(145 70% 60%)',
  rare: 'hsl(195 100% 65%)',
  epic: 'hsl(280 100% 75%)',
  legendary: 'hsl(45 100% 65%)',
};

/**
 * ProgressDashboard — shows the user's specimen count next to badge
 * mission goals. Reuses the existing BADGES catalog (Audit option A).
 */
export default function ProgressDashboard() {
  const [specimens, setSpecimens] = useState(null);

  useEffect(() => {
    base44.entities.Specimen.list().then((s) => setSpecimens(s || []));
  }, []);

  if (!specimens) {
    return (
      <GlassPanel className="p-6 text-center text-amethyst/60 text-sm">
        Loading progress…
      </GlassPanel>
    );
  }

  const metrics = React.useMemo(() => {
    return typeof computeMetrics === 'function' ? computeMetrics(specimens) : null;
  }, [specimens]);

  const rows = React.useMemo(() => {
    if (!metrics) return [];
    return BADGES.map((b) => {
      const { current, target } = b.progress(metrics);
      return { ...b, current, target, earned: current >= target };
    });
  }, [metrics]);

  const earnedCount = rows.filter((r) => r.earned).length;
  const totalCount = rows.length;

  // Sort: in-progress (closest to done) first, then untouched, then earned.
  const inProgress = rows
    .filter((r) => !r.earned && r.current > 0)
    .sort((a, b) => b.current / b.target - a.current / a.target);
  const untouched = rows.filter((r) => !r.earned && r.current === 0);
  const earned = rows.filter((r) => r.earned);
  const ordered = [...inProgress, ...untouched, ...earned].slice(0, 5);

  return (
    <GlassPanel className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-amethyst-glow" />
          <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-amethyst-glow">
            Mission Progress
          </span>
        </div>
        <Link
          to="/badges"
          className="flex items-center gap-1 text-[11px] text-amethyst/70 hover:text-amethyst-glow"
        >
          {earnedCount}/{totalCount} earned
          <ChevronRight size={12} />
        </Link>
      </div>

      <div className="space-y-3">
        {ordered.map((row) => (
          <ProgressRow key={row.code} row={row} />
        ))}
      </div>
    </GlassPanel>
  );
}

function ProgressRow({ row }) {
  const Icon = ICONS[row.icon] || Gem;
  const pct = Math.max(0, Math.min(100, (row.current / row.target) * 100));
  const color = RARITY_COLOR[row.rarity] || RARITY_COLOR.common;
  const colorAlpha = (a) => color.replace('hsl(', 'hsla(').replace(')', ` / ${a})`);

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
        style={{
          background: row.earned ? colorAlpha(0.18) : 'hsla(220,30%,15%,0.4)',
          border: `1px solid ${row.earned ? color : 'hsla(220,30%,40%,0.3)'}`,
          boxShadow: row.earned ? `0 0 14px ${colorAlpha(0.3)}` : 'none',
        }}
      >
        <Icon size={16} style={{ color: row.earned ? color : 'hsla(0,0%,80%,0.5)' }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <span
            className={`text-[13px] font-medium truncate ${
              row.earned ? 'text-white' : 'text-white/85'
            }`}
          >
            {row.title}
          </span>
          <span
            className="text-[10px] font-mono tabular-nums tracking-wider flex-shrink-0"
            style={{ color: row.earned ? color : 'hsla(0,0%,80%,0.6)' }}
          >
            {row.current}/{row.target}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-white/5">
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{
              width: `${pct}%`,
              background: row.earned
                ? color
                : 'linear-gradient(90deg, hsla(280,80%,55%,0.6), hsla(195,100%,55%,0.6))',
              boxShadow: row.earned ? `0 0 10px ${colorAlpha(0.5)}` : 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}