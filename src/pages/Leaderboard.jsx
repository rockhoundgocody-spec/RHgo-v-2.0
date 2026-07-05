import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crown, Search, Scale, Gem, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

const MEDAL = ['🥇', '🥈', '🥉'];
const ROW_GLOW = ['hsla(45,100%,60%,0.30)', 'hsla(215,25%,65%,0.20)', 'hsla(30,80%,55%,0.20)'];

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

function AvatarCircle({ name, isYou }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
      style={{
        background: isYou ? 'hsla(265,60%,22%,0.9)' : 'hsla(220,30%,12%,0.8)',
        border: isYou ? '1px solid hsla(280,80%,60%,0.4)' : '1px solid hsla(220,30%,30%,0.3)',
        color: isYou ? 'hsl(280,100%,88%)' : 'hsla(0,0%,100%,0.7)',
      }}>
      {initial}
    </div>
  );
}

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('unique'); // 'unique' | 'weight'

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => {});
    base44.functions.invoke('getLeaderboard')
      .then((res) => setRows(res?.data?.rows || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const sortKey = sortBy === 'weight' ? 'total_weight_lbs' : 'unique_minerals';
  const sorted = useMemo(
    () => [...rows].sort((a, b) => b[sortKey] - a[sortKey] || b.unique_minerals - a.unique_minerals),
    [rows, sortKey]
  );

  const myEmail = (me?.email || '').toLowerCase();
  const myRow = sorted.find((r) => (r.email || '').toLowerCase() === myEmail);
  const myRank = myRow ? sorted.indexOf(myRow) + 1 : null;

  const filtered = search.trim()
    ? sorted.filter((r) => (r.name || '').toLowerCase().includes(search.toLowerCase()))
    : sorted;

  return (
    <div className="min-h-screen pb-28 px-4 pt-6 max-w-md mx-auto">
      {/* HUD Header */}
      <div className="mb-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/55 mb-1">Global Command</div>
        <h1 className="text-3xl font-black text-white tracking-tight">Collector Rankings</h1>
        <p className="text-white/55 text-[11px] uppercase tracking-[0.22em] mt-1">
          Ranked by unique minerals &amp; total weight
        </p>
      </div>

      {/* Your rank callout */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="relative rounded-2xl overflow-hidden mb-5 p-4"
        style={{
          background: 'linear-gradient(135deg, hsla(265,70%,26%,0.92), hsla(280,55%,20%,0.92))',
          border: '1px solid hsla(280,80%,70%,0.45)',
          boxShadow: '0 0 40px -10px hsla(280,80%,65%,0.5)',
        }}>
        <ScanLine />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ background: 'hsla(265,60%,20%,0.8)', border: '1px solid hsla(280,80%,60%,0.3)' }}>
            {myRank ? MEDAL[myRank - 1] || '🏅' : '🌱'}
          </div>
          <div className="flex-1">
            <div className="text-[9px] uppercase tracking-[0.35em] text-amethyst-glow mb-0.5">Your rank</div>
            <div className="text-white font-black text-lg leading-none">
              {myRank ? `#${myRank} globally` : 'Not ranked yet'}
            </div>
            <div className="text-white/70 text-[10px] mt-0.5">
              {myRow
                ? `${myRow.unique_minerals} unique · ${myRow.total_weight_lbs} lb`
                : 'Log a specimen to appear'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-amethyst-glow font-black text-2xl tabular-nums">
              {myRow ? myRow[sortKey] : 0}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-white/55">
              {sortBy === 'weight' ? 'lbs' : 'minerals'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sort toggle */}
      <div className="flex gap-2 mb-4">
        <SortPill active={sortBy === 'unique'} onClick={() => setSortBy('unique')} icon={Gem} label="Unique Minerals" />
        <SortPill active={sortBy === 'weight'} onClick={() => setSortBy('weight')} icon={Scale} label="Total Weight" />
      </div>

      {/* Leaderboard table */}
      <GlassPanel variant="hud" className="overflow-hidden relative">
        <ScanLine />
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-hud-cyan/15">
          <Crown size={12} className="text-yellow-400" />
          <span className="text-[9px] font-mono uppercase tracking-[0.35em] text-yellow-300/80">
            {sortBy === 'weight' ? 'Weight Rankings' : 'Discovery Rankings'}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[8px] text-white/55 uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-white/5">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'hsla(220,30%,12%,0.7)', border: '1px solid hsla(220,30%,35%,0.3)' }}>
            <Search size={12} className="text-white/55 shrink-0" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="flex-1 bg-transparent text-white/85 text-xs placeholder:text-white/40 outline-none"
            />
          </div>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {loading && (
            <div className="py-10 flex flex-col items-center gap-2 text-white/55">
              <Loader2 size={20} className="animate-spin text-amethyst-glow" />
              <p className="text-xs">Tallying collections…</p>
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-8 text-center text-white/55 text-sm">
              {search ? `No collectors match "${search}"` : 'No collectors ranked yet — be the first!'}
            </div>
          )}
          {!loading && filtered.map((entry) => {
            const originalIdx = sorted.indexOf(entry);
            const isTop3 = originalIdx < 3;
            const isYou = (entry.email || '').toLowerCase() === myEmail;
            const medal = isTop3 ? MEDAL[originalIdx] : `#${originalIdx + 1}`;
            return (
              <motion.div
                key={entry.user_id || entry.email}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(originalIdx * 0.04, 0.5) }}
                className="flex items-center gap-3 px-4 py-3 transition-all"
                style={isYou ? {
                  background: 'hsla(265,60%,15%,0.5)', borderLeft: '2px solid hsla(280,90%,65%,0.7)',
                } : isTop3 ? { background: ROW_GLOW[originalIdx] } : {}}>
                <div className="w-7 text-center shrink-0">
                  {isTop3
                    ? <span className="text-base">{medal}</span>
                    : <span className="text-[10px] font-mono text-white/55">{medal}</span>}
                </div>
                <AvatarCircle name={entry.name} isYou={isYou} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold truncate ${isYou ? 'text-amethyst-glow' : isTop3 ? 'text-white' : 'text-white/90'}`}>
                    {entry.name}
                    {isYou && <span className="ml-1.5 text-[8px] px-1.5 py-0.5 rounded-full bg-amethyst/30 text-amethyst-glow border border-amethyst/40">YOU</span>}
                  </div>
                  <div className="text-[9px] text-white/55 truncate">
                    {entry.unique_minerals} unique minerals · {entry.specimen_count} finds
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-black tabular-nums text-sm ${isYou ? 'text-amethyst-glow' : isTop3 ? 'text-yellow-300' : 'text-white/85'}`}>
                    {sortBy === 'weight'
                      ? `${entry.total_weight_lbs} lb`
                      : entry[sortKey]}
                  </div>
                  <div className="text-[8px] text-white/55 uppercase tracking-wider">
                    {sortBy === 'weight' ? 'weight' : 'unique'}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="px-4 py-3 border-t border-white/5">
          <p className="text-[9px] text-white/55 text-center font-mono">
            {rows.length} collectors ranked · weight tracked for legal limits · discovery counts every new mineral
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}

function SortPill({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95"
      style={active ? {
        background: 'linear-gradient(135deg, hsla(265,70%,40%,0.9), hsla(280,60%,30%,0.9))',
        border: '1px solid hsla(280,80%,65%,0.5)',
        color: 'hsl(280,100%,90%)',
        boxShadow: '0 0 16px hsla(280,80%,60%,0.3)',
      } : {
        background: 'hsla(220,30%,12%,0.7)',
        border: '1px solid hsla(220,30%,30%,0.3)',
        color: 'hsla(0,0%,100%,0.55)',
      }}
      aria-pressed={active}
    >
      <Icon size={12} /> {label}
    </button>
  );
}