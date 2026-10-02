import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Star, Zap } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import HudFrame from '@/components/visuals/HudFrame.jsx';
import { useEntityList } from '@/lib/useEntityQuery';
import { cn } from '@/lib/utils';

const moodColor = {
  radiant: '#fcd34d',
  happy:   '#6ee7b7',
  calm:    '#67e8f9',
  drowsy:  '#a5b4fc',
  tender:  '#f0abfc',
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-lg px-3 py-2 text-xs">
      <div className="text-amethyst/70 mb-1">{label}</div>
      <div className="text-white font-semibold">+{payload[0]?.value || 0} XP</div>
      {payload[0]?.payload?.mood && (
        <div className="text-amethyst/50 mt-0.5 capitalize">{payload[0].payload.mood}</div>
      )}
    </div>
  );
}

export default function CompanionProgressDashboard({ companion }) {
  const { data: logsRaw = [], isLoading: logsLoading } = useEntityList('CompanionLog', '-log_date', 30);

  const last30 = useMemo(() => logsRaw.slice(0, 30).reverse(), [logsRaw]);

  const chartData = useMemo(() =>
    last30.map((l) => ({
      day: new Date(l.log_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      xp: l.xp_gained || 0,
      mood: l.mood,
      fill: moodColor[l.mood] || '#a78bfa',
    })),
  [last30]);

  const totalXP7d = useMemo(
    () => logsRaw.slice(0, 7).reduce((a, l) => a + (l.xp_gained || 0), 0),
    [logsRaw],
  );

  // Level progress ring math
  const level = companion?.level ?? 1;
  const xp = companion?.xp ?? 0;
  const xpForLevel = 100;
  const xpInLevel = xp % xpForLevel;
  const levelPct = Math.round((xpInLevel / xpForLevel) * 100);
  const circumference = 2 * Math.PI * 36; // r=36
  const dashOffset = circumference - (levelPct / 100) * circumference;

  const isLoading = logsLoading;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-hud-cyan/70">
          Companion Progress
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-hud-cyan/40 to-transparent" />
      </div>

      {/* Level + XP ring + quick stats */}
      <GlassPanel className="p-5">
        <div className="flex items-center gap-6">
          {/* Level ring */}
          <div className="relative flex-shrink-0 w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" strokeWidth="5" fill="none" className="stroke-white/10" />
              <circle
                cx="40" cy="40" r="36" strokeWidth="5" fill="none"
                stroke="hsl(280,100%,75%)"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Star size={12} className="text-amethyst-glow mb-0.5" />
              <div className="text-xl font-bold text-white leading-none">{level}</div>
              <div className="text-[9px] text-amethyst/60 uppercase tracking-widest">lvl</div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 grid grid-cols-3 gap-3 text-center">
            <StatCell icon={Zap} label="Total XP" value={xp} color="text-amethyst-glow" />
            <StatCell icon={TrendingUp} label="7-Day XP" value={`+${totalXP7d}`} color="text-emerald-300" />
            <StatCell icon={Star} label="Streak" value={`${companion?.streak_days ?? 0}d`} color="text-amber-300" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-[10px] text-amethyst/50 mb-1">
            <span>XP to next level</span>
            <span>{xpInLevel} / {xpForLevel}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amethyst-deep to-amethyst-glow transition-all duration-700"
              style={{ width: `${levelPct}%` }}
            />
          </div>
        </div>
      </GlassPanel>

      {/* XP Trend chart */}
      <GlassPanel>
        <HudFrame label="XP Trend · Last 30 Days">
          {isLoading ? (
            <div className="h-40 rounded animate-pulse bg-white/5" />
          ) : chartData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-white/30 text-sm italic">
              No history yet — earn XP by logging specimens.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(280,100%,75%)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(280,100%,75%)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tick={{ fill: 'hsla(270,30%,70%,0.5)', fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: 'hsla(270,30%,70%,0.5)', fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="xp"
                  stroke="hsl(280,100%,75%)"
                  strokeWidth={2}
                  fill="url(#xpGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: 'hsl(280,100%,75%)', stroke: 'none' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </HudFrame>
      </GlassPanel>


    </div>
  );
}

function StatCell({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 py-2.5">
      <Icon size={13} className={cn('mx-auto mb-1', color)} />
      <div className={cn('text-sm font-bold', color)}>{value}</div>
      <div className="text-[9px] uppercase tracking-[0.2em] text-white/40">{label}</div>
    </div>
  );
}