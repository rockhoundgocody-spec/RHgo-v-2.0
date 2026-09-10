import React from 'react';

const RARITY_META = [
  { key: 'common',    label: 'Common',    color: 'hsl(210,15%,70%)' },
  { key: 'uncommon',  label: 'Uncommon',  color: 'hsl(150,80%,60%)' },
  { key: 'rare',      label: 'Rare',      color: 'hsl(215,95%,70%)' },
  { key: 'legendary', label: 'Legendary', color: 'hsl(45,95%,65%)' },
];

export default function RarityDistribution({ specimens }) {
  const total = specimens.length || 1;

  // Optimization (Bolt): Tally rarity counts in a single O(N) pass over specimens
  // rather than performing 4 separate array filter passes (O(4N)).
  const rarityMap = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
  for (let i = 0; i < specimens.length; i++) {
    const key = specimens[i].rarity || 'common';
    if (rarityMap[key] !== undefined) {
      rarityMap[key]++;
    } else {
      rarityMap.common++;
    }
  }

  const counts = RARITY_META.map((m) => ({
    ...m,
    count: rarityMap[m.key] || 0,
  }));

  return (
    <div className="glass-panel rounded-2xl p-4">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60 mb-3">
        Rarity Distribution
      </h2>
      <div className="space-y-2.5">
        {counts.map(({ key, label, color, count }) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={key}>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="font-semibold" style={{ color }}>{label}</span>
                <span className="text-white/50">{count} · {pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}