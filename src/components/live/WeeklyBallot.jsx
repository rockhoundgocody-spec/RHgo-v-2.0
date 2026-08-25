import React, { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Trophy, Heart, Loader2, Sparkles, Crown } from 'lucide-react';

const RARITY_COLOR = {
  common: '#94a3b8',
  uncommon: '#34d399',
  rare: '#38bdf8',
  legendary: '#a78bfa',
};

function countdown(closesAt) {
  const ms = new Date(closesAt).getTime() - Date.now();
  if (ms <= 0) return 'Voting closed';
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  if (d > 0) return `Voting closes in ${d}d ${h}h`;
  const m = Math.floor((ms % 3600000) / 60000);
  return `Voting closes in ${h}h ${m}m`;
}

/**
 * The weekly Find of the Week ballot — confirmed finds ranked by live community
 * vote count. Re-fetches on any FindVote change so the leaderboard stays live.
 */
export default function WeeklyBallot() {
  const [data, setData] = useState(null);
  const [voting, setVoting] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('getWeeklyBallot', {});
      setData(res?.data || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const unsub = base44.entities.FindVote.subscribe(() => { load(); });
    return unsub;
  }, [load]);

  const vote = async (entryId) => {
    setVoting(entryId);
    try {
      await base44.functions.invoke('castFindVote', { entry_id: entryId });
      await load();
    } finally {
      setVoting(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-amethyst-glow" /></div>;
  }

  if (!data || data.entries.length === 0) {
    return (
      <div className="rounded-2xl px-5 py-12 text-center" style={{ background: 'hsla(220,40%,6%,0.6)', border: '1px solid hsla(270,30%,25%,0.3)' }}>
        <Trophy size={32} className="mx-auto text-white/20 mb-3" />
        <p className="text-white/70 text-sm font-semibold">No confirmed finds this week yet</p>
        <p className="text-white/40 text-xs mt-1.5">Hosts: confirm a 70%+ identification during your stream to enter the ballot.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-amethyst-glow">
          <Sparkles size={11} /> {data.week_key} · {data.total_votes || 0} votes
        </div>
        <div className="text-[10px] font-mono text-white/45">{countdown(data.closes_at)}</div>
      </div>

      <div className="space-y-2.5">
        {data.entries.map((e, i) => {
          const color = RARITY_COLOR[e.rarity] || RARITY_COLOR.common;
          const isMyVote = data.my_vote === e.id;
          const isLeader = i === 0 && e.votes > 0;
          return (
            <div key={e.id} className="rounded-2xl overflow-hidden" style={{ background: 'hsla(220,40%,7%,0.7)', border: `1px solid ${isLeader ? color + '88' : color + '33'}` }}>
              <div className="flex">
                <div className="relative w-28 shrink-0">
                  {e.image_url ? (
                    <img src={e.image_url} alt={e.mineral_name} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: color + '22' }}>
                      <Sparkles size={20} style={{ color }} />
                    </div>
                  )}
                  <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black"
                    style={{ background: isLeader ? color : 'hsla(220,40%,5%,0.8)', color: isLeader ? '#1a1628' : '#fff' }}>
                    {isLeader ? <Crown size={12} /> : e.rank}
                  </div>
                </div>
                <div className="flex-1 p-2.5 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white/95 truncate">{e.mineral_name}</div>
                      <div className="text-[10px] font-mono mt-0.5" style={{ color }}>{e.rarity} · {Math.round((e.confidence || 0) * 100)}%</div>
                      <div className="text-[10px] text-white/40 mt-0.5 truncate">by {e.host_name}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-black" style={{ color }}>{e.votes}</div>
                      <div className="text-[8px] uppercase tracking-wider text-white/30">votes</div>
                    </div>
                  </div>
                  <button
                    onClick={() => vote(e.id)}
                    disabled={voting === e.id || isMyVote}
                    className="mt-2 w-full h-8 rounded-lg text-[11px] font-bold uppercase tracking-wider transition disabled:opacity-60 flex items-center justify-center gap-1.5"
                    style={isMyVote
                      ? { background: color + '22', color, border: `1px solid ${color}66` }
                      : { background: 'hsla(220,40%,12%,0.8)', color: '#fff', border: `1px solid ${color}44` }}
                  >
                    {voting === e.id ? <Loader2 size={12} className="animate-spin" />
                      : isMyVote ? <><Heart size={12} className="fill-current" /> Voted</>
                      : <><Heart size={12} /> Vote</>}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}