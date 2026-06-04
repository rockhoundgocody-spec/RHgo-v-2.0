import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// Seasons rotate by month. Each has a name, theme, emoji, reward, and gradient.
const SEASONS = [
  { months: [11, 0, 1],  name: 'Crystal Winter',      emoji: '❄️',  theme: 'Hunt for geodes buried in frost-cracked outcrops.', reward: 'Ice Crystal Badge', gradient: 'from-sky-900/70 to-blue-900/40',   border: 'border-sky-400/30',  color: '#38bdf8' },
  { months: [2, 3, 4],   name: 'Spring Fluorite Fest', emoji: '💚',  theme: 'Fluorite veins awaken. Follow the green light.', reward: 'Fluorite Hunter Badge', gradient: 'from-emerald-900/70 to-green-900/40', border: 'border-emerald-400/30', color: '#34d399' },
  { months: [5, 6, 7],   name: 'Summer Fossil Hunt',   emoji: '🦕',  theme: 'Exposed creek beds reveal ancient life.', reward: 'Fossil Pioneer Badge', gradient: 'from-amber-900/70 to-orange-900/40',  border: 'border-amber-400/30', color: '#fbbf24' },
  { months: [8, 9, 10],  name: 'Meteorite Month',      emoji: '☄️',  theme: 'Iron-rich strikes appear in plowed fields.', reward: 'Cosmic Hunter Badge', gradient: 'from-purple-900/70 to-fuchsia-900/40', border: 'border-fuchsia-400/30', color: '#e879f9' },
];

function getCurrentSeason() {
  const m = new Date().getMonth();
  return SEASONS.find((s) => s.months.includes(m)) || SEASONS[2];
}

export default function SeasonBanner() {
  const season = getCurrentSeason();
  const daysLeft = Math.ceil((new Date(new Date().getFullYear(), Math.max(...season.months) + 1, 1) - new Date()) / 86400000);

  return (
    <Link
      to="/explore"
      className={`block rounded-2xl border bg-gradient-to-br ${season.gradient} ${season.border} p-4 transition-all active:scale-[0.98]`}
      style={{ boxShadow: `0 4px 24px -8px ${season.color}50` }}
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl shrink-0 mt-0.5">{season.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[9px] font-bold uppercase tracking-[0.3em]" style={{ color: season.color }}>
              Active Season
            </span>
            <span className="text-[9px] text-white/30">{daysLeft}d left</span>
          </div>
          <div className="text-white font-bold text-sm leading-tight">{season.name}</div>
          <div className="text-white/50 text-[10px] mt-0.5 leading-relaxed">{season.theme}</div>
          <div className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: season.color }}>
            Reward: {season.reward} <ArrowRight size={9} />
          </div>
        </div>
      </div>
    </Link>
  );
}