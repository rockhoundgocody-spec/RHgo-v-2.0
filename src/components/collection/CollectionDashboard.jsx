/**
 * CollectionDashboard — HUD-styled analytics panel for the Collection page.
 * Shows rarity breakdown donut, top minerals bar chart, finds-over-time, and geo heatmap summary.
 */
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Gem, MapPin, Star, TrendingUp, Zap } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import ProfileBadgeStrip from '@/components/badges/ProfileBadgeStrip.jsx';

const RARITY_COLORS = {
  common:    { color: '#94a3b8', label: 'Common'    },
  uncommon:  { color: '#34d399', label: 'Uncommon'  },
  rare:      { color: '#38bdf8', label: 'Rare'      },
  legendary: { color: '#c084fc', label: 'Legendary' },
};

function SectionHeader({ icon: IconComp, label, color = '#22d3ee' }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <IconComp size={11} style={{ color }} />
      <span className="text-[9px] font-mono uppercase tracking-[0.35em]" style={{ color }}>{label}</span>
    </div>
  );
}

function StatBadge({ value, label, color }) {
  return (
    <div className="rounded-xl px-3 py-2.5 text-center"
      style={{ background: 'hsla(220,40%,22%,0.85)', border: `1px solid ${color}55` }}>
      <div className="font-black text-xl leading-none" style={{ color }}>{value}</div>
      <div className="text-[8px] uppercase tracking-[0.2em] text-white/70 mt-1">{label}</div>
    </div>
  );
}

export default function CollectionDashboard({ specimens = [] }) {
  // ── Consolidated Stats ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    const counts = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
    const mineralMap = {};
    const geoMap = {};
    const rarestFinds = [];
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (7 - i) * 7);
      return { label: `W${i + 1}`, count: 0, start: new Date(d) };
    });
    const uniqueNamesSet = new Set();
    let verifiedCount = 0;
    let rarePlusCount = 0;
    let confSum = 0;
    let confCount = 0;

    specimens.forEach((s) => {
      // Rarity
      if (counts[s.rarity] !== undefined) counts[s.rarity]++;

      // Mineral names & unique count
      if (s.mineral_name) {
        mineralMap[s.mineral_name] = (mineralMap[s.mineral_name] || 0) + 1;
        uniqueNamesSet.add(s.mineral_name);
      }

      // Weekly finds
      if (s.found_date) {
        const d = new Date(s.found_date);
        for (let i = weeks.length - 1; i >= 0; i--) {
          if (d >= weeks[i].start) { weeks[i].count++; break; }
        }
      }

      // Geo distribution
      const loc = s.found_at?.split(',')[0]?.trim() || 'Unknown';
      geoMap[loc] = (geoMap[loc] || 0) + 1;

      // Rarest finds (limit to 3)
      if ((s.rarity === 'legendary' || s.rarity === 'rare') && rarestFinds.length < 3) {
        rarestFinds.push(s);
      }

      // Verified count
      if (s.verified) verifiedCount++;

      // Rare+ count
      if (s.rarity === 'rare' || s.rarity === 'legendary') rarePlusCount++;

      // AI confidence sum
      if (s.ai_confidence) {
        confSum += s.ai_confidence;
        confCount++;
      }
    });

    return {
      rarityData: Object.entries(counts)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: RARITY_COLORS[k].label, value: v, color: RARITY_COLORS[k].color, key: k })),
      topMinerals: Object.entries(mineralMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, count]) => ({ name: name.length > 10 ? name.slice(0, 9) + '…' : name, count })),
      weeklyFinds: weeks.map(({ label, count }) => ({ label, count })),
      geoStates: Object.entries(geoMap).sort((a, b) => b[1] - a[1]).slice(0, 5),
      rarestFinds,
      verified: verifiedCount,
      uniqueNames: uniqueNamesSet.size,
      rarePlus: rarePlusCount,
      avgConf: confCount > 0 ? confSum / confCount : 0
    };
  }, [specimens]);

  if (specimens.length === 0) {
    return (
      <GlassPanel variant="hud" className="p-8 text-center">
        <Gem size={32} className="mx-auto text-hud-cyan/30 mb-3" />
        <p className="text-white/80 text-sm">No data yet — scan your first specimen to unlock your dashboard.</p>
      </GlassPanel>
    );
  }

  const { rarityData, topMinerals, weeklyFinds, geoStates, rarestFinds, verified, uniqueNames, rarePlus, avgConf } = stats;

  return (
    <div className="space-y-4">
      {/* ── Badge strip ── */}
      <ProfileBadgeStrip />

      {/* ── Summary stat row ── */}
      <div className="grid grid-cols-4 gap-2">
        <StatBadge value={specimens.length} label="Total"   color="#22d3ee" />
        <StatBadge value={uniqueNames}       label="Unique"  color="#22d3ee" />
        <StatBadge value={rarePlus}          label="Rare+"   color="#c084fc" />
        <StatBadge value={verified}          label="Verified" color="#34d399" />
      </div>

      {/* ── Rarity donut + AI confidence ── */}
      <GlassPanel variant="hud" className="p-4">
        <SectionHeader icon={Star} label="Rarity Breakdown" />
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={100} height={100}>
            <PieChart>
              <Pie data={rarityData} cx="50%" cy="50%" innerRadius={28} outerRadius={46} paddingAngle={2} dataKey="value" stroke="none">
                {rarityData.map((entry) => <Cell key={entry.key} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-1.5">
            {rarityData.map((d) => (
              <div key={d.key} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-[10px] text-white/85 flex-1">{d.name}</span>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: d.color }}>{d.value}</span>
              </div>
            ))}
            {avgConf > 0 && (
              <div className="pt-1 border-t border-white/5 flex items-center gap-2">
                <Zap size={9} className="text-yellow-400/70" />
                <span className="text-[9px] text-white/65">Avg AI confidence</span>
                <span className="text-[9px] font-bold text-yellow-400/80 ml-auto">{(avgConf * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>
        </div>
      </GlassPanel>

      {/* ── Top minerals bar chart ── */}
      {topMinerals.length > 0 && (
        <GlassPanel variant="hud" className="p-4">
          <SectionHeader icon={Gem} label="Top Minerals" />
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={topMinerals} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.75)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsla(240,30%,8%,0.95)', border: '1px solid hsla(195,100%,60%,0.3)', borderRadius: 8, fontSize: 11 }}
                itemStyle={{ color: '#22d3ee' }}
                cursor={{ fill: 'hsla(195,100%,60%,0.05)' }}
              />
              <Bar dataKey="count" fill="#22d3ee" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassPanel>
      )}

      {/* ── Finds over time ── */}
      <GlassPanel variant="hud" className="p-4">
        <SectionHeader icon={TrendingUp} label="Finds Over Time" color="#a78bfa" />
        <ResponsiveContainer width="100%" height={90}>
          <LineChart data={weeklyFinds} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
            <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.70)', fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={false} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: 'hsla(240,30%,8%,0.95)', border: '1px solid hsla(280,80%,60%,0.3)', borderRadius: 8, fontSize: 11 }}
              itemStyle={{ color: '#a78bfa' }}
            />
            <Line type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2} dot={{ fill: '#a78bfa', r: 3 }} activeDot={{ r: 5, fill: '#c084fc' }} />
          </LineChart>
        </ResponsiveContainer>
      </GlassPanel>

      {/* ── Rarest finds highlight ── */}
      {rarestFinds.length > 0 && (
        <GlassPanel className="p-4">
          <SectionHeader icon={Star} label="Rarest Finds" color="#c084fc" />
          <div className="space-y-2">
            {rarestFinds.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl p-2.5"
                style={{ background: s.rarity === 'legendary' ? 'hsla(265,60%,24%,0.75)' : 'hsla(200,60%,22%,0.75)', border: `1px solid ${RARITY_COLORS[s.rarity]?.color || '#fff'}55` }}>
                {s.image_url
                  ? <img src={s.image_url} alt={s.mineral_name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  : <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'hsla(265,40%,15%,0.7)' }}>
                      <Gem size={16} style={{ color: RARITY_COLORS[s.rarity]?.color }} />
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{s.mineral_name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[8px] uppercase tracking-[0.2em] font-bold" style={{ color: RARITY_COLORS[s.rarity]?.color }}>{s.rarity}</span>
                    {s.found_at && <span className="text-[8px] text-white/30 truncate">· {s.found_at}</span>}
                  </div>
                </div>
                {s.ai_confidence && (
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-yellow-400">{(s.ai_confidence * 100).toFixed(0)}%</div>
                    <div className="text-[7px] text-white/25 uppercase">AI</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* ── Geographic hotspots ── */}
      {geoStates.length > 0 && (
        <GlassPanel variant="hud" className="p-4">
          <SectionHeader icon={MapPin} label="Top Locations" color="#34d399" />
          <div className="space-y-2">
            {geoStates.map(([loc, count], i) => {
              const pct = Math.round((count / specimens.length) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-white/85 truncate max-w-[70%]">{loc}</span>
                    <span className="text-[10px] font-bold text-emerald-400 tabular-nums">{count} finds</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/15 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#34d399' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
