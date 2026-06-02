import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Gem } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import { useEntityList } from '@/lib/useEntityQuery';

const RARITY_COLORS = {
  legendary: '#c084fc',
  rare: '#7dd3fc',
  uncommon: '#6ee7b7',
  common: '#a0a0b0',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, count, rarity } = payload[0].payload;
  return (
    <div className="glass-panel rounded-xl px-3 py-2 text-xs text-white/80">
      <div className="font-semibold text-white">{name}</div>
      <div className="text-white/50">{count} found · <span style={{ color: RARITY_COLORS[rarity] }}>{rarity}</span></div>
    </div>
  );
};

export default function SpecimenTypeChart() {
  const { data: specimens = [], isLoading } = useEntityList('Specimen', '-found_date');

  const chartData = useMemo(() => {
    const counts = {};
    specimens.forEach((s) => {
      const key = s.mineral_name;
      if (!counts[key]) counts[key] = { name: key, count: 0, rarity: s.rarity || 'common' };
      counts[key].count += 1;
    });
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [specimens]);

  if (isLoading) return null;
  if (!chartData.length) return null;

  return (
    <GlassPanel className="p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Gem size={14} className="text-amethyst-glow" />
        <span className="text-white/60 text-[11px] uppercase tracking-[0.2em]">Finds by Mineral</span>
        <span className="ml-auto text-white/25 text-[10px] font-mono">{specimens.length} total</span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={18}>
          <XAxis
            dataKey="name"
            tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            interval={0}
            tickFormatter={(v) => v.length > 8 ? v.slice(0, 7) + '…' : v}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={RARITY_COLORS[entry.rarity] || RARITY_COLORS.common} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </GlassPanel>
  );
}