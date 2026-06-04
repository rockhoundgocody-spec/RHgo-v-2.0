import React from 'react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import { Trophy, Crown } from 'lucide-react';
import { getRank } from './LiveStatStrip.jsx';

// Static leaderboard to inspire competition — seeded with aspirational data
const LEADERBOARD = [
  { name: 'Crystal_Kid_CO',  finds: 247, rank: 'Geo Legend',         emoji: '🏆', age: '14' },
  { name: 'PebblePupPro',    finds: 183, rank: 'Volcano Vanquisher',  emoji: '🌋', age: '11' },
  { name: 'QuartzQueen99',   finds: 142, rank: 'Gemstone Warlord',    emoji: '👑', age: '16' },
  { name: 'BasaltBoy2025',   finds: 98,  rank: 'Gemstone Warlord',    emoji: '👑', age: '13' },
  { name: 'FlintFinder_TX',  finds: 67,  rank: 'Quartz Commander',    emoji: '⚡', age: '9'  },
];

export default function RockStarLeaderboard({ userFinds = 0, userEmail = '' }) {
  const userHandle = userEmail?.split('@')[0]?.slice(0, 12) || 'You';
  const userRank = getRank(userFinds);

  // Find user position in board
  const userPos = LEADERBOARD.findIndex((e) => e.finds < userFinds);
  const insertIdx = userPos === -1 ? LEADERBOARD.length : userPos;

  const board = [
    ...LEADERBOARD.slice(0, insertIdx),
    { name: userHandle, finds: userFinds, rank: userRank.label, emoji: userRank.emoji, isYou: true },
    ...LEADERBOARD.slice(insertIdx),
  ].slice(0, 6);

  return (
    <GlassPanel className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Crown size={13} className="text-yellow-400" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-yellow-300 font-bold">
            Rock Stars Under 18
          </span>
          <span className="ml-auto text-[9px] text-white/25 uppercase tracking-wider">Global</span>
        </div>

        <div className="space-y-1.5">
          {board.map((entry, i) => {
            const isYou = entry.isYou;
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
            return (
              <div
                key={i}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all ${
                  isYou ? 'border border-amethyst/40 bg-amethyst/10' : 'bg-white/3'
                }`}
              >
                <span className="text-sm w-6 text-center shrink-0">{medal}</span>
                <span className="text-base shrink-0">{entry.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold truncate ${isYou ? 'text-amethyst-glow' : 'text-white/80'}`}>
                    {entry.name}
                    {isYou && <span className="ml-1 text-[9px] text-amethyst/60">(you)</span>}
                  </div>
                  <div className="text-[9px] text-white/35">{entry.rank}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-xs font-bold tabular-nums ${isYou ? 'text-amethyst-glow' : 'text-white/70'}`}>
                    {entry.finds}
                  </div>
                  <div className="text-[8px] text-white/25 uppercase">finds</div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[9px] text-white/20 text-center mt-3 italic">
          Leaderboard refreshes weekly. Keep scanning!
        </p>
      </div>
    </GlassPanel>
  );
}