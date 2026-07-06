import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Clock, Sparkles, RefreshCw,
  Flame, Zap, ChevronLeft, Trophy, Target, Star, Cpu,
} from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import { SkeletonList } from '@/components/visuals/SkeletonCard.jsx';

// ── Quest template pool ──────────────────────────────────────────────────────
const QUEST_TEMPLATES = [
  { title: "Beginner's Luck",    description: 'Find and scan any specimen today.',            target_count: 1,  xp_reward: 50,  quest_type: 'daily',   clover_message: 'Every legend starts with a single find. Go get one!' },
  { title: 'Trio Tracker',       description: 'Scan 3 different minerals.',                    target_count: 3,  xp_reward: 150, quest_type: 'daily',   clover_message: "Three finds, three stories. I'll be watching the radar." },
  { title: 'Eyes on the Ground', description: 'Log any find with GPS coordinates.',            target_count: 1,  xp_reward: 75,  quest_type: 'daily',   clover_message: 'Every pin on the map is a story waiting to be told.' },
  { title: 'Rare Hunter',        description: 'Discover a rare or legendary specimen.',        target_count: 1,  xp_reward: 300, quest_type: 'weekly',  target_rarity: 'rare', clover_message: 'Only 12% of rockhounds find one of these. Today might be your day.' },
  { title: 'Chain Builder',      description: 'Log 5 specimens this week.',                    target_count: 5,  xp_reward: 200, quest_type: 'weekly',  clover_message: 'Five finds build a chain. Chains become legends.' },
  { title: 'Deep Atlas',         description: 'Log a specimen with detailed notes & photos.',  target_count: 3,  xp_reward: 250, quest_type: 'weekly',  clover_message: 'Detail is the difference between a find and a discovery.' },
  { title: 'The Collector',      description: 'Reach 10 total specimens.',                     target_count: 10, xp_reward: 500, quest_type: 'monthly', clover_message: "Ten specimens. You're becoming a serious explorer." },
];

function getExpiryDate(type) {
  const d = new Date();
  if (type === 'daily') d.setHours(d.getHours() + 24);
  else if (type === 'weekly') d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + 30);
  return d.toISOString();
}

const TYPE_COLOR = { daily: '#34d399', weekly: '#38bdf8', monthly: '#a78bfa' };
const TYPE_BG    = { daily: 'hsla(145,60%,15%,0.25)', weekly: 'hsla(200,80%,15%,0.25)', monthly: 'hsla(270,60%,15%,0.25)' };
const TYPE_BORDER= { daily: 'hsla(145,70%,45%,0.25)', weekly: 'hsla(200,90%,55%,0.25)', monthly: 'hsla(270,80%,55%,0.25)' };

// ── XP Level helper ──────────────────────────────────────────────────────────
function xpToLevel(xp) {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const currentLevelXp = Math.pow(level - 1, 2) * 100;
  const nextLevelXp = Math.pow(level, 2) * 100;
  const pct = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
  return { level, pct: Math.min(pct, 100), nextLevelXp, currentLevelXp };
}

// ── Quest Card ───────────────────────────────────────────────────────────────
function QuestCard({ q }) {
  const [expanded, setExpanded] = useState(false);
  const pct  = Math.min((q.progress / q.target_count) * 100, 100);
  const done = q.status === 'completed' || pct >= 100;
  const color  = TYPE_COLOR[q.quest_type]  || '#94a3b8';
  const bg     = TYPE_BG[q.quest_type]     || 'hsla(0,0%,10%,0.3)';
  const border = TYPE_BORDER[q.quest_type] || 'hsla(0,0%,50%,0.2)';

  // Time remaining
  const hoursLeft = q.expires_at
    ? Math.max(0, Math.floor((new Date(q.expires_at) - Date.now()) / 3_600_000))
    : null;
  const timeLabel = hoursLeft !== null
    ? hoursLeft > 48 ? `${Math.floor(hoursLeft / 24)}d left` : `${hoursLeft}h left`
    : null;

  return (
    <div
      className="rounded-2xl p-4 transition-all cursor-pointer select-none"
      style={{ background: bg, border: `1px solid ${border}`, opacity: done ? 0.7 : 1 }}
      onClick={() => setExpanded(e => !e)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] px-2 py-0.5 rounded-full"
              style={{ background: `${color}18`, color }}>
              {q.quest_type}
            </span>
            {done && (
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400">
                Complete ✓
              </span>
            )}
          </div>
          <div className="text-white font-bold text-sm leading-tight">{q.title}</div>
          <div className="text-white/45 text-[11px] mt-0.5 leading-relaxed">{q.description}</div>
        </div>

        {/* XP badge + chevron */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex flex-col items-center shrink-0 px-3 py-2 rounded-xl"
            style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
            <span className="text-base font-black leading-none" style={{ color }}>+{q.xp_reward}</span>
            <span className="text-[8px] uppercase tracking-widest text-white/30">XP</span>
          </div>
          <span className="text-white/25 text-[10px]" style={{ transform: expanded ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-white/6 overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: done ? '#34d399' : color, boxShadow: `0 0 8px ${color}60` }} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/35 font-mono">{q.progress}/{q.target_count} · {pct.toFixed(0)}%</span>
        {timeLabel && !done && (
          <span className="text-[9px] text-white/25 flex items-center gap-1">
            <Clock size={8} /> {timeLabel}
          </span>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-3 space-y-2" onClick={e => e.stopPropagation()}>
          {q.clover_message && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-xl"
              style={{ background: `${color}08`, borderLeft: `2px solid ${color}40` }}>
              <span className="text-base leading-none">🍀</span>
              <p className="text-[10px] italic text-white/40 leading-relaxed">"{q.clover_message}"</p>
            </div>
          )}
          <div className="px-3 py-2 rounded-xl" style={{ background: 'hsla(0,0%,100%,0.04)', border: '1px solid hsla(0,0%,100%,0.08)' }}>
            <div className="text-[9px] uppercase tracking-[0.25em] text-white/30 mb-1">Reward</div>
            <div className="text-sm font-bold" style={{ color }}>+{q.xp_reward} XP</div>
          </div>
          {q.target_rarity && (
            <div className="px-3 py-2 rounded-xl" style={{ background: 'hsla(0,0%,100%,0.04)', border: '1px solid hsla(0,0%,100%,0.08)' }}>
              <div className="text-[9px] uppercase tracking-[0.25em] text-white/30 mb-1">Target Rarity</div>
              <div className="text-sm font-bold text-amber-300 capitalize">{q.target_rarity}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Streak Ring ──────────────────────────────────────────────────────────────
function StreakRing({ streak }) {
  const radius = 36;
  const circ   = 2 * Math.PI * radius;
  // 30-day cycle
  const pct = Math.min((streak % 30) / 30, 1);
  const offset = circ * (1 - pct);

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg width="96" height="96" className="absolute inset-0 -rotate-90">
        <circle cx="48" cy="48" r={radius} stroke="hsla(30,90%,60%,0.1)" strokeWidth="6" fill="none" />
        <circle cx="48" cy="48" r={radius}
          stroke="url(#streakGrad)"
          strokeWidth="6" fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
        <defs>
          <linearGradient id="streakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
      </svg>
      <div className="relative text-center">
        <div className="text-2xl font-black text-orange-400 leading-none">{streak}</div>
        <div className="text-[8px] uppercase tracking-[0.25em] text-orange-400/60 mt-0.5">days</div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function QuestDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [companion, setCompanion] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState('all'); // all | daily | weekly | monthly

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const companions = await base44.entities.Companion.filter({ owner_email: u.email });
      if (companions[0]) setCompanion(companions[0]);
    }).catch(() => {});
  }, []);

  const { data: quests = [], refetch, isLoading } = useQuery({
    queryKey: ['quests-dashboard', user?.email],
    queryFn: () => base44.entities.Quest.filter({ owner_email: user.email, status: 'active' }),
    enabled: !!user?.email,
    staleTime: 30_000,
  });

  const { data: completedQuests = [] } = useQuery({
    queryKey: ['quests-completed', user?.email],
    queryFn: () => base44.entities.Quest.filter({ owner_email: user.email, status: 'completed' }),
    enabled: !!user?.email,
    staleTime: 60_000,
  });

  const generateQuests = async () => {
    if (!user?.email || generating) return;
    setGenerating(true);
    try {
      // Try AI-generated missions first
      let lat, lng;
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {}

      const res = await base44.functions.invoke('generateFieldMissions', { lat, lng });
      if (!res?.data?.count) throw new Error('no missions returned');
    } catch {
      // Fallback to static templates
      const picks = [...QUEST_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, 3);
      await Promise.all(picks.map(t =>
        base44.entities.Quest.create({
          owner_email: user.email,
          ...t,
          status: 'active',
          progress: 0,
          expires_at: getExpiryDate(t.quest_type),
        })
      ));
    } finally {
      setGenerating(false);
      refetch();
    }
  };

  // Totals
  const totalXP = completedQuests.reduce((s, q) => s + (q.xp_reward || 0), 0);
  const { level, pct: lvlPct, nextLevelXp, currentLevelXp } = xpToLevel(totalXP);
  const streak = companion?.streak_days ?? 0;
  const xpToNext = nextLevelXp - currentLevelXp;
  const xpProgress = totalXP - currentLevelXp;

  // Filter out expired quests from the active view
  const now = Date.now();
  const activeQuests = quests.filter(q => !q.expires_at || new Date(q.expires_at).getTime() > now);
  const filtered = filter === 'all' ? activeQuests : activeQuests.filter(q => q.quest_type === filter);
  const daily   = activeQuests.filter(q => q.quest_type === 'daily');
  const weekly  = activeQuests.filter(q => q.quest_type === 'weekly');

  return (
    <div className="min-h-screen px-4 pt-4 max-w-2xl mx-auto" style={{ paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 0px))' }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 transition"
          style={{ background: 'hsla(0,0%,100%,0.06)', border: '1px solid hsla(0,0%,100%,0.1)' }}>
          <ChevronLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-black text-white leading-tight">Field Missions</h1>
          <p className="text-white/35 text-[11px]">Challenges · XP · Expedition Streak</p>
        </div>
        <button onClick={generateQuests} disabled={generating || activeQuests.length > 0}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition disabled:opacity-40"
          style={{ background: 'hsla(280,80%,35%,0.5)', border: '1px solid hsla(280,80%,55%,0.3)', color: 'hsl(280,80%,80%)' }}>
          {generating ? <Cpu size={10} className="animate-pulse" /> : <RefreshCw size={10} />}
          {generating ? 'AI…' : quests.length === 0 ? 'New Mission' : 'Active'}
        </button>
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Streak */}
        <GlassPanel className="p-3 flex flex-col items-center gap-1 col-span-1">
          <Flame size={13} className="text-orange-400" />
          <div className="text-2xl font-black text-orange-400">{streak}</div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-white/30">Streak</div>
        </GlassPanel>

        {/* Total XP */}
        <GlassPanel className="p-3 flex flex-col items-center gap-1 col-span-1">
          <Zap size={13} className="text-yellow-400" />
          <div className="text-2xl font-black text-yellow-400">{totalXP.toLocaleString()}</div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-white/30">Total XP</div>
        </GlassPanel>

        {/* Completed */}
        <GlassPanel className="p-3 flex flex-col items-center gap-1 col-span-1">
          <Trophy size={13} className="text-amethyst-glow" />
          <div className="text-2xl font-black text-amethyst-glow">{completedQuests.length}</div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-white/30">Done</div>
        </GlassPanel>
      </div>

      {/* ── XP LEVEL TRACKER ── */}
      <GlassPanel className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <StreakRing streak={streak} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-1">
              <div>
                <span className="text-[10px] uppercase tracking-[0.25em] text-white/30">Level </span>
                <span className="text-xl font-black text-white">{level}</span>
              </div>
              <span className="text-[10px] font-mono text-white/35">{xpProgress.toLocaleString()} / {xpToNext.toLocaleString()} XP</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/6 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${lvlPct}%`,
                  background: 'linear-gradient(90deg, hsl(270,80%,55%), hsl(280,100%,75%))',
                  boxShadow: '0 0 10px hsla(280,100%,70%,0.5)',
                }} />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[9px] text-white/25">
                {streak > 0 ? `🔥 ${streak}-day streak — keep going!` : '⚡ Start your streak today'}
              </span>
              <span className="text-[9px] font-bold text-amethyst/60">{lvlPct.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* ── FILTER TABS ── */}
      <div className="flex gap-2 mb-4">
        {['all', 'daily', 'weekly', 'monthly'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] transition-all"
            style={{
              background: filter === f ? TYPE_BG[f] || 'hsla(270,40%,20%,0.5)' : 'hsla(0,0%,100%,0.04)',
              border: `1px solid ${filter === f ? (TYPE_BORDER[f] || 'hsla(270,60%,55%,0.4)') : 'hsla(0,0%,100%,0.08)'}`,
              color: filter === f ? (TYPE_COLOR[f] || 'hsl(280,80%,80%)') : 'hsla(0,0%,100%,0.35)',
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* ── QUEST LIST ── */}
      {isLoading ? (
        <SkeletonList count={3} />
      ) : filtered.length === 0 ? (
        <GlassPanel className="p-8 text-center">
          <Sparkles size={28} className="mx-auto text-amethyst/30 mb-3" />
          <p className="text-white/50 text-sm font-semibold mb-1">
            {activeQuests.length === 0 ? 'No active field missions' : `No ${filter} missions active`}
          </p>
          <p className="text-white/25 text-xs mb-4">
            {activeQuests.length === 0 ? 'Your next expedition starts here — Clover will generate AI-tailored missions based on your collection and location.' : 'Switch tabs or dispatch new field missions'}
          </p>
          {activeQuests.length === 0 && (
            <button onClick={generateQuests} disabled={generating}
              className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-[0.2em] text-white/70 hover:text-white transition disabled:opacity-40 flex items-center gap-2 mx-auto"
              style={{ background: 'hsla(280,80%,30%,0.4)', border: '1px solid hsla(280,80%,55%,0.3)' }}>
              {generating ? <Cpu size={11} className="animate-pulse" /> : <Sparkles size={11} />}
              {generating ? 'Clover is building your missions…' : 'Generate AI Field Missions'}
            </button>
          )}
        </GlassPanel>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => <QuestCard key={q.id} q={q} />)}
        </div>
      )}

      {/* ── PROGRESS SUMMARY ── */}
      {activeQuests.length > 0 && (
        <GlassPanel className="mt-6 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target size={13} className="text-hud-cyan" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-bold">Progress Summary</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Daily', quests: daily, color: TYPE_COLOR.daily },
              { label: 'Weekly', quests: weekly, color: TYPE_COLOR.weekly },
            ].map(({ label, quests: qs, color }) => {
              const done = qs.filter(q => (q.progress / q.target_count) >= 1).length;
              return (
                <div key={label} className="px-3 py-2.5 rounded-xl"
                  style={{ background: `${color}10`, border: `1px solid ${color}22` }}>
                  <div className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color }}>{label}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black" style={{ color }}>{done}</span>
                    <span className="text-white/30 text-xs">/ {qs.length}</span>
                  </div>
                  <div className="text-[9px] text-white/25">completed</div>
                </div>
              );
            })}
          </div>

          {/* Pending XP */}
          {(() => {
            const pending = activeQuests.reduce((s, q) => s + (q.xp_reward || 0), 0);
            return (
              <div className="mt-3 flex items-center justify-between px-3 py-2.5 rounded-xl"
                style={{ background: 'hsla(280,80%,15%,0.25)', border: '1px solid hsla(280,60%,50%,0.2)' }}>
                <div className="flex items-center gap-2">
                  <Star size={12} className="text-amethyst-glow" />
                  <span className="text-[10px] text-white/50">Pending XP available</span>
                </div>
                <span className="text-sm font-black text-amethyst-glow">+{pending.toLocaleString()}</span>
              </div>
            );
          })()}
        </GlassPanel>
      )}
    </div>
  );
}