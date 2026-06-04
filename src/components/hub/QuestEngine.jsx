import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Sword, CheckCircle2, Clock, Sparkles, RefreshCw } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

const QUEST_TEMPLATES = [
  { title: 'Beginner\'s Luck', description: 'Find and scan any specimen today.', target_count: 1, xp_reward: 50,  quest_type: 'daily',   clover_message: 'Every legend starts with a single find. Go get one!' },
  { title: 'Trio Tracker',     description: 'Scan 3 different minerals.',         target_count: 3, xp_reward: 150, quest_type: 'daily',   clover_message: 'Three finds, three stories. I\'ll be watching the radar.' },
  { title: 'Rare Hunter',      description: 'Discover a rare or legendary specimen.', target_count: 1, target_rarity: 'rare', xp_reward: 300, quest_type: 'weekly', clover_message: 'Only 12% of rockhounds find one of these. Today might be your day.' },
  { title: 'Chain Builder',    description: 'Log 5 specimens this week.',          target_count: 5, xp_reward: 200, quest_type: 'weekly',  clover_message: 'Five finds build a chain. Chains become legends.' },
  { title: 'The Collector',    description: 'Reach 10 total specimens.',           target_count: 10, xp_reward: 500, quest_type: 'monthly', clover_message: 'Ten specimens. You\'re becoming a serious explorer.' },
];

function getExpiryDate(type) {
  const d = new Date();
  if (type === 'daily') d.setHours(d.getHours() + 24);
  else if (type === 'weekly') d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + 30);
  return d.toISOString();
}

export default function QuestEngine({ userEmail }) {
  const { data: quests = [], refetch, isLoading } = useQuery({
    queryKey: ['quests', userEmail],
    queryFn: () => base44.entities.Quest.filter({ owner_email: userEmail, status: 'active' }),
    enabled: !!userEmail,
    staleTime: 60_000,
  });
  const [generating, setGenerating] = useState(false);

  const generateQuests = async () => {
    if (!userEmail || generating) return;
    setGenerating(true);
    const picks = [...QUEST_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, 3);
    await Promise.all(picks.map((t) =>
      base44.entities.Quest.create({
        owner_email: userEmail,
        ...t,
        status: 'active',
        progress: 0,
        expires_at: getExpiryDate(t.quest_type),
      })
    ));
    setGenerating(false);
    refetch();
  };

  const questTypeColor = { daily: '#34d399', weekly: '#38bdf8', monthly: '#a78bfa' };
  const questTypeBg =   { daily: 'bg-emerald-900/15 border-emerald-400/20', weekly: 'bg-sky-900/15 border-sky-400/20', monthly: 'bg-amethyst-deep/15 border-amethyst/25' };

  if (isLoading) return null;

  return (
    <GlassPanel className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sword size={14} className="text-amethyst-glow" />
          <span className="text-white/80 text-xs font-semibold uppercase tracking-[0.2em]">Active Quests</span>
        </div>
        <button
          onClick={generateQuests}
          disabled={generating}
          className="flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] text-amethyst/60 hover:text-amethyst-glow transition"
        >
          <RefreshCw size={9} className={generating ? 'animate-spin' : ''} />
          {quests.length === 0 ? 'Ask Clover' : 'Refresh'}
        </button>
      </div>

      {quests.length === 0 ? (
        <div className="text-center py-4">
          <Sparkles size={20} className="mx-auto text-amethyst/30 mb-2" />
          <p className="text-white/40 text-[11px]">Tap "Ask Clover" for today's quests</p>
        </div>
      ) : (
        <div className="space-y-2">
          {quests.slice(0, 3).map((q) => {
            const pct = Math.min((q.progress / q.target_count) * 100, 100);
            const done = q.status === 'completed' || pct >= 100;
            const color = questTypeColor[q.quest_type] || '#94a3b8';
            const bg    = questTypeBg[q.quest_type] || 'bg-white/5 border-white/10';
            return (
              <div key={q.id} className={`rounded-xl border p-3 ${bg}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {done
                        ? <CheckCircle2 size={11} style={{ color }} />
                        : <Clock size={11} style={{ color }} />
                      }
                      <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color }}>
                        {q.quest_type}
                      </span>
                    </div>
                    <div className="text-white/90 text-xs font-semibold">{q.title}</div>
                    <div className="text-white/45 text-[10px] mt-0.5 leading-tight">{q.description}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-bold" style={{ color }}>+{q.xp_reward}</div>
                    <div className="text-[8px] text-white/30 uppercase tracking-wider">XP</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color }} />
                </div>
                <div className="mt-1 text-[9px] text-white/30">
                  {q.progress}/{q.target_count} · {pct.toFixed(0)}%
                </div>

                {q.clover_message && (
                  <div className="mt-2 text-[9px] italic text-white/35 border-l-2 pl-2" style={{ borderColor: `${color}40` }}>
                    Clover: "{q.clover_message}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </GlassPanel>
  );
}