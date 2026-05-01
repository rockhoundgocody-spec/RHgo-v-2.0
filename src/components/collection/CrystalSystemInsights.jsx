import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Sparkles, Hexagon } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

// Amethyst-themed palette for the bars
const PALETTE = [
  'hsl(280 100% 70%)',
  'hsl(265 90% 60%)',
  'hsl(250 85% 65%)',
  'hsl(295 80% 65%)',
  'hsl(220 85% 65%)',
  'hsl(195 100% 60%)',
  'hsl(310 75% 65%)',
];

export default function CrystalSystemInsights({ specimens }) {
  const [minerals, setMinerals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Mineral.list().then((d) => {
      setMinerals(d || []);
      setLoading(false);
    });
  }, []);

  const data = useMemo(() => {
    if (!specimens?.length || !minerals.length) return [];
    // Build name → crystal_system lookup (case-insensitive)
    const lookup = new Map();
    for (const m of minerals) {
      if (m.name && m.crystal_system) {
        lookup.set(m.name.toLowerCase().trim(), m.crystal_system);
      }
    }
    const counts = {};
    for (const s of specimens) {
      const key = s.mineral_name?.toLowerCase().trim();
      const sys = key ? lookup.get(key) : null;
      const label = sys || 'Unknown';
      counts[label] = (counts[label] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([system, count]) => ({ system, count }))
      .sort((a, b) => b.count - a.count);
  }, [specimens, minerals]);

  if (loading) return null;
  if (!specimens?.length) return null;

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const top = data[0];

  return (
    <GlassPanel className="mb-6">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <Hexagon className="text-amethyst-glow" size={14} />
          <span className="text-amethyst-glow text-[10px] uppercase tracking-[0.3em]">
            Insights
          </span>
        </div>
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-white font-semibold text-lg tracking-wide">Crystal Systems</h3>
          {top && top.system !== 'Unknown' && (
            <span className="text-[10px] text-amethyst/70 flex items-center gap-1">
              <Sparkles size={10} />
              Most: {top.system}
            </span>
          )}
        </div>

        {data.length === 0 ? (
          <div className="text-center py-6 text-white/50 text-sm">
            No crystal system data yet.
          </div>
        ) : (
          <>
            <div className="h-44 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="system"
                    stroke="hsl(280 30% 70%)"
                    tick={{ fontSize: 10, fill: 'hsl(280 30% 80%)' }}
                    interval={0}
                    angle={data.length > 4 ? -25 : 0}
                    textAnchor={data.length > 4 ? 'end' : 'middle'}
                    height={data.length > 4 ? 50 : 24}
                  />
                  <YAxis
                    stroke="hsl(280 30% 70%)"
                    tick={{ fontSize: 10, fill: 'hsl(280 30% 80%)' }}
                    allowDecimals={false}
                    width={24}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsla(280, 100%, 60%, 0.08)' }}
                    contentStyle={{
                      background: 'hsla(240, 30%, 8%, 0.95)',
                      border: '1px solid hsla(280, 60%, 50%, 0.3)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: 'hsl(280 100% 80%)' }}
                    itemStyle={{ color: 'white' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {data.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-[10px] text-white/40 text-center tracking-wide">
              {data.length} system{data.length !== 1 ? 's' : ''} across {total} specimen{total !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>
    </GlassPanel>
  );
}