import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useEntityList } from '@/lib/useEntityQuery.js';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import { TrendingUp, Gem } from 'lucide-react';
import { format, subDays, parseISO, isValid } from 'date-fns';

const DAYS = 14;

const RARITY_COLORS = {
  common:    'hsl(195,100%,70%)',
  uncommon:  'hsl(150,80%,60%)',
  rare:      'hsl(270,85%,75%)',
  legendary: 'hsl(40,100%,65%)',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs"
      style={{
        background: 'hsla(255,30%,14%,0.96)',
        border: '1px solid hsla(270,40%,50%,0.3)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="text-white/60 mb-1 font-medium">{label}</div>
      {payload.map((p) => p.value > 0 && (
        <div key={p.dataKey} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="capitalize text-white/80">{p.dataKey}:</span>
          <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
      <div className="border-t border-white/10 mt-1 pt-1 text-white/50">
        Total: <span className="text-white font-bold">{total}</span>
      </div>
    </div>
  );
};

export default function DiscoveryTrendChart() {
  // Optimization (Bolt): Request only required fields via projection to reduce network payload and memory parsing overhead
  const { data: specimens = [], isLoading } = useEntityList('Specimen', '-found_date', undefined, {
    fields: ['id', 'found_date', 'created_date', 'rarity'],
  });
  const [mode, setMode] = useState('stacked'); // 'stacked' | 'total'

  const { chartData, totalFinds, bestDay, streak } = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: DAYS }, (_, i) => {
      const d = subDays(today, DAYS - 1 - i);
      return { date: format(d, 'MMM d'), key: format(d, 'yyyy-MM-dd'), common: 0, uncommon: 0, rare: 0, legendary: 0, total: 0 };
    });
    const dayMap = Object.fromEntries(days.map((d) => [d.key, d]));

    for (const s of specimens) {
      const raw = s.found_date || s.created_date?.slice(0, 10);
      if (!raw) continue;
      const parsed = parseISO(raw);
      if (!isValid(parsed)) continue;
      const key = format(parsed, 'yyyy-MM-dd');
      if (dayMap[key]) {
        const rarity = s.rarity || 'common';
        if (dayMap[key][rarity] !== undefined) dayMap[key][rarity]++;
        dayMap[key].total++;
      }
    }

    const totalFinds = days.reduce((s, d) => s + d.total, 0);
    const bestDay = days.reduce((best, d) => d.total > best.total ? d : best, days[0]);

    // Current streak (consecutive days with at least 1 find ending today)
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].total > 0) streak++;
      else break;
    }

    return { chartData: days, totalFinds, bestDay, streak };
  }, [specimens]);

  if (isLoading) {
    return (
      <GlassPanel className="p-4 animate-pulse">
        <div className="h-32 bg-white/5 rounded-lg" />
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} style={{ color: 'hsl(195,100%,70%)' }} />
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">
            Discovery Trends
          </span>
          <span className="text-[10px] text-white/30">· last {DAYS} days</span>
        </div>
        <div className="flex gap-1">
          {['stacked', 'total'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider transition-colors"
              style={{
                background: mode === m ? 'hsla(270,60%,55%,0.3)' : 'hsla(255,20%,20%,0.4)',
                color: mode === m ? 'hsl(270,85%,82%)' : 'rgba(255,255,255,0.3)',
                border: `1px solid ${mode === m ? 'hsla(270,60%,55%,0.4)' : 'hsla(255,20%,50%,0.15)'}`,
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Stat pills */}
      <div className="flex gap-2 mb-3">
        <Pill label="14-day finds" value={totalFinds} color="hsl(195,100%,70%)" />
        <Pill label="Best day" value={`${bestDay.total} on ${bestDay.date}`} color="hsl(270,85%,78%)" small />
        <Pill label="Streak" value={`${streak}d`} color="hsl(40,100%,65%)" />
      </div>

      {/* Chart */}
      {totalFinds === 0 ? (
        <div className="flex flex-col items-center justify-center h-24 gap-2 text-white/25">
          <Gem size={20} />
          <span className="text-xs">No finds yet — go explore!</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={chartData} margin={{ top: 4, right: 2, left: -28, bottom: 0 }}>
            <defs>
              {Object.entries(RARITY_COLORS).map(([key, color]) => (
                <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }}
              tickLine={false}
              axisLine={false}
              interval={3}
            />
            <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            {mode === 'stacked' ? (
              Object.entries(RARITY_COLORS).map(([key, color]) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={color}
                  strokeWidth={1.5}
                  fill={`url(#grad-${key})`}
                  dot={false}
                  activeDot={{ r: 3, fill: color }}
                />
              ))
            ) : (
              <Area
                type="monotone"
                dataKey="total"
                stroke="hsl(195,100%,70%)"
                strokeWidth={2}
                fill="url(#grad-common)"
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(195,100%,70%)' }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Rarity legend */}
      {mode === 'stacked' && totalFinds > 0 && (
        <div className="flex gap-3 mt-2 justify-center flex-wrap">
          {Object.entries(RARITY_COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-[9px] capitalize text-white/35">{key}</span>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}

function Pill({ label, value, color, small }) {
  return (
    <div
      className="flex-1 rounded-lg px-2 py-1.5 text-center"
      style={{ background: 'hsla(255,20%,14%,0.6)', border: '1px solid hsla(255,20%,40%,0.12)' }}
    >
      <div className={`font-bold leading-none mb-0.5 ${small ? 'text-[10px]' : 'text-sm'}`} style={{ color }}>{value}</div>
      <div className="text-[9px] text-white/30 uppercase tracking-wider">{label}</div>
    </div>
  );
}