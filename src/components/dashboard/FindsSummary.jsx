import React from 'react';
import { Gem, Sparkles, MapPin, CalendarDays } from 'lucide-react';

export default function FindsSummary({ specimens }) {
  const total = specimens.length;

  // Optimization (Bolt): Compute summary metrics in a single pass over specimens
  // and pre-capture current month/year to eliminate redundant new Date() calls per item.
  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();

  let rareCount = 0;
  let withLocation = 0;
  let thisMonth = 0;

  for (let i = 0; i < total; i++) {
    const s = specimens[i];
    if (s.rarity === 'rare' || s.rarity === 'legendary') rareCount++;
    if (s.lat != null) withLocation++;
    const d = s.found_date || s.created_date;
    if (d) {
      const dt = new Date(d);
      if (dt.getMonth() === curMonth && dt.getFullYear() === curYear) {
        thisMonth++;
      }
    }
  }

  const stats = [
    { icon: Gem, label: 'Total Finds', value: total, color: 'hsl(280,85%,80%)' },
    { icon: Sparkles, label: 'Rare+', value: rareCount, color: 'hsl(45,90%,70%)' },
    { icon: CalendarDays, label: 'This Month', value: thisMonth, color: 'hsl(195,100%,75%)' },
    { icon: MapPin, label: 'Mapped', value: withLocation, color: 'hsl(150,80%,65%)' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="glass-panel rounded-2xl p-3 text-center">
          <Icon size={16} className="mx-auto mb-1.5" style={{ color, filter: `drop-shadow(0 0 6px ${color})` }} />
          <div className="text-xl font-black text-white leading-none">{value}</div>
          <div className="text-[8px] uppercase tracking-[0.18em] text-white/50 mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}