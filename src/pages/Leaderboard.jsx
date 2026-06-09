import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Trophy, Zap, Shield, Flame, Star, Users, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useEntityList } from '@/lib/useEntityQuery';
import { getRank } from '@/components/hub/LiveStatStrip.jsx';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

// Seeded aspirational board — real user injects themselves
const SEED_BOARD = [
  { name: 'Crystal_Kid_CO',  finds: 247, emoji: '🏆', badge: 'Geo Legend'          },
  { name: 'PebblePupPro',    finds: 183, emoji: '🌋', badge: 'Volcano Vanquisher'  },
  { name: 'QuartzQueen99',   finds: 142, emoji: '🌋', badge: 'Volcano Vanquisher'  },
  { name: 'BasaltBoy2025',   finds: 98,  emoji: '👑', badge: 'Gemstone Warlord'    },
  { name: 'FlintFinder_TX',  finds: 67,  emoji: '👑', badge: 'Gemstone Warlord'    },
  { name: 'GeodeDiva_IL',    finds: 44,  emoji: '⚡', badge: 'Quartz Commander'   },
  { name: 'RockPup_MT',      finds: 28,  emoji: '⚡', badge: 'Quartz Commander'    },
  { name: 'MicaMike_AZ',     finds: 11,  emoji: '💎', badge: 'Crystal Scout'       },
];

const MEDAL = ['🥇', '🥈', '🥉'];
const ROW_GLOW = ['hsla(45,100%,60%,0.3)', 'hsla(215,25%,65%,0.2)', 'hsla(30,80%,55%,0.2)'];

function ScanLine() {
  return (
    <div className="absolute inset-x-0 top-0 h-full overflow-hidden pointer-events-none rounded-2xl">
      <motion.div
        className="absolute inset-x-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, hsla(195,100%,60%,0.5), transparent)' }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
      />
    </div>
  );
}

export default function Leaderboard() {
  const [userEmail, setUserEmail] = useState('');
  const [search, setSearch] = useState('');
  const { data: specimens = [] } = useEntityList('Specimen', '-found_date');
  const userFinds = specimens.length;
  const userHandle = userEmail?.split('@')[0]?.slice(0, 14) || 'You';
  const userRank = getRank(userFinds);

  useEffect(() => {
    base44.auth.me().then((u) => { if (u?.email) setUserEmail(u.email); }).catch(() => {});
  }, []);

  // Merge user into board at correct position
  const userPos = SEED_BOARD.findIndex((e) => e.finds < userFinds);
  const insertIdx = userPos === -1 ? SEED_BOARD.length : userPos;
  const board = [
    ...SEED_BOARD.slice(0, insertIdx),
    { name: userHandle, finds: userFinds, emoji: userRank.emoji, badge: userRank.label, isYou: true },
    ...SEED_BOARD.slice(insertIdx),
  ];

  const yourPos = board.findIndex((e) => e.isYou) + 1;
  const filteredBoard = search.trim()
    ? board.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.badge.toLowerCase().includes(search.toLowerCase()))
    : board;

  return (
    <div className="min-h-screen pb-28 px-4 pt-6 max-w-md mx-auto">

      {/* HUD Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-6 rounded-full" style={{ background: 'linear-gradient(180deg, #fbbf24, #f97316)' }} />
          <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-yellow-400/80">Global Command</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Rock Stars</h1>
        <p className="text-white/60 text-[11px] uppercase tracking-[0.25em] mt-1">Top mineral collectors worldwide</p>
      </div>

      {/* Your rank callout */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative rounded-2xl overflow-hidden mb-5 p-4"
        style={{
          background: 'linear-gradient(135deg, hsla(265,70%,26%,0.92), hsla(280,55%,20%,0.92))',
          border: '1px solid hsla(280,80%,70%,0.45)',
          boxShadow: '0 0 40px -10px hsla(280,80%,65%,0.5)',
        }}
      >
        <ScanLine />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ background: 'hsla(265,60%,20%,0.8)', border: '1px solid hsla(280,80%,60%,0.3)' }}>
            {userRank.emoji}
          </div>
          <div className="flex-1">
            <div className="text-[9px] uppercase tracking-[0.35em] text-amethyst-glow mb-0.5">Your rank</div>
            <div className="text-white font-black text-lg leading-none">{userRank.label}</div>
            <div className="text-white/70 text-[10px] mt-0.5">{userFinds} finds · #{yourPos} globally</div>
          </div>
          <div className="text-right">
            <div className="text-amethyst-glow font-black text-2xl">{userFinds}</div>
            <div className="text-[9px] uppercase tracking-wider text-white/30">finds</div>
          </div>
        </div>
      </motion.div>

      {/* Leaderboard table */}
      <GlassPanel variant="hud" className="overflow-hidden relative">
        <ScanLine />
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-hud-cyan/15">
          <Crown size={12} className="text-yellow-400" />
          <span className="text-[9px] font-mono uppercase tracking-[0.35em] text-yellow-300/80">Collector Rankings</span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[8px] text-white/30 uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Search / Filter */}
        <div className="px-4 py-2 border-b border-white/5">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'hsla(220,30%,12%,0.7)', border: '1px solid hsla(220,30%,35%,0.3)' }}>
            <Search size={12} className="text-white/30 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or rank..."
              className="flex-1 bg-transparent text-white/80 text-xs placeholder:text-white/25 outline-none"
            />
          </div>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {filteredBoard.length === 0 ? (
            <div className="py-8 text-center text-white/30 text-sm">No results for "{search}"</div>
          ) : null}
          {filteredBoard.map((entry, i) => {
            const originalIdx = board.indexOf(entry);
            const isTop3 = originalIdx < 3;
            const isYou = entry.isYou;
            const medal = isTop3 ? MEDAL[originalIdx] : `#${originalIdx + 1}`;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 px-4 py-3 transition-all"
                style={isYou ? {
                  background: 'hsla(265,60%,15%,0.5)',
                  borderLeft: '2px solid hsla(280,90%,65%,0.7)',
                } : isTop3 ? {
                  background: `${ROW_GLOW[originalIdx]}`,
                } : {}}
              >
                {/* Medal / rank */}
                <div className="w-7 text-center shrink-0">
                  {isTop3 ? (
                    <span className="text-base">{medal}</span>
                  ) : (
                    <span className="text-[10px] font-mono text-white/30">{medal}</span>
                  )}
                </div>

                {/* Avatar emoji */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0"
                  style={{
                    background: isYou ? 'hsla(265,60%,22%,0.9)' : 'hsla(220,30%,12%,0.8)',
                    border: isYou ? '1px solid hsla(280,80%,60%,0.4)' : '1px solid hsla(220,30%,30%,0.3)',
                  }}>
                  {entry.emoji}
                </div>

                {/* Name + badge */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold truncate ${isYou ? 'text-amethyst-glow' : isTop3 ? 'text-white' : 'text-white/90'}`}>
                    {entry.name}
                    {isYou && <span className="ml-1.5 text-[8px] px-1.5 py-0.5 rounded-full bg-amethyst/30 text-amethyst-glow border border-amethyst/40">YOU</span>}
                  </div>
                  <div className="text-[9px] text-white/60 truncate">{entry.badge}</div>
                </div>

                {/* Finds count */}
                <div className="text-right shrink-0">
                  <div className={`font-black tabular-nums text-sm ${isYou ? 'text-amethyst-glow' : isTop3 ? 'text-yellow-300' : 'text-white/85'}`}>
                    {entry.finds}
                  </div>
                  <div className="text-[8px] text-white/50 uppercase tracking-wider">finds</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="px-4 py-3 border-t border-white/5">
          <p className="text-[9px] text-white/50 text-center font-mono">
            Leaderboard resets monthly · keep scanning to climb the ranks
          </p>
        </div>
      </GlassPanel>

      {/* Rank tiers legend */}
      <div className="mt-4">
        <div className="text-[9px] font-mono uppercase tracking-[0.35em] text-white/60 mb-2 px-1">Rank Tiers</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { min: 0,   label: 'Pebble Pup',         emoji: '🐾', color: '#94a3b8' },
            { min: 3,   label: 'Flint Finder',        emoji: '🪨', color: '#34d399' },
            { min: 10,  label: 'Crystal Scout',       emoji: '💎', color: '#38bdf8' },
            { min: 25,  label: 'Quartz Commander',    emoji: '⚡', color: '#a78bfa' },
            { min: 50,  label: 'Gemstone Warlord',    emoji: '👑', color: '#fbbf24' },
            { min: 100, label: 'Volcano Vanquisher',  emoji: '🌋', color: '#f97316' },
            { min: 200, label: 'Geo Legend',          emoji: '🏆', color: '#e879f9' },
          ].map((tier) => (
            <div key={tier.min}
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'hsla(220,30%,22%,0.75)', border: `1px solid ${tier.color}55` }}>
              <span className="text-sm">{tier.emoji}</span>
              <div>
                <div className="text-[10px] font-semibold" style={{ color: tier.color }}>{tier.label}</div>
                <div className="text-[8px] text-white/60">{tier.min}+ finds</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}