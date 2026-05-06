import React, { useMemo } from 'react';
import { Sparkles, TrendingUp, Heart, Zap, Calendar } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import HudFrame from '@/components/visuals/HudFrame.jsx';
import { useEntityList } from '@/lib/useEntityQuery';
import { cn } from '@/lib/utils';

const moodEmoji = {
  radiant: '✨',
  happy: '😊',
  calm: '🌿',
  drowsy: '💤',
  tender: '💜',
};

const moodColor = {
  radiant: 'text-amber-300',
  happy: 'text-emerald-300',
  calm: 'text-cyan-300',
  drowsy: 'text-indigo-300',
  tender: 'text-pink-300',
};

/**
 * DailyCompanionSummary — in-app "notification" view.
 * Shows today's mood + XP gain and a 7-day mini history.
 */
export default function DailyCompanionSummary({ companion }) {
  const { data: logsRaw = [], isLoading } = useEntityList('CompanionLog', '-log_date');
  const logs = useMemo(() => logsRaw.slice(0, 14), [logsRaw]);
  const last7 = useMemo(() => logs.slice(0, 7).reverse(), [logs]);
  const today = logs[0] || null;

  // Derive a "live" today view from companion if no log written yet today.
  const todayMood = today?.mood || companion?.mood || 'calm';
  const todayXpGained = today?.xp_gained ?? 0;
  const totalGained7d = last7.reduce((a, l) => a + (l.xp_gained || 0), 0);
  const maxGain = Math.max(1, ...last7.map((l) => l.xp_gained || 0));

  return (
    <GlassPanel variant="amethyst">
      <HudFrame label="Daily Summary">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-amethyst/70 text-[10px] uppercase tracking-[0.3em]">
              <Calendar size={12} />
              Today
            </div>
            <div className={cn('text-3xl mt-1', moodColor[todayMood])}>
              {moodEmoji[todayMood]} <span className="capitalize">{todayMood}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-amethyst/70 text-[10px] uppercase tracking-[0.3em]">XP Today</div>
            <div className="text-2xl font-semibold text-white flex items-center gap-1 justify-end">
              <TrendingUp size={16} className="text-emerald-300" />+{todayXpGained}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <Stat icon={Sparkles} label="Level" value={companion?.level ?? today?.level ?? 1} />
          <Stat icon={Heart} label="Streak" value={`${companion?.streak_days ?? today?.streak_days ?? 0}d`} />
          <Stat icon={Zap} label="Energy" value={companion?.energy ?? today?.energy ?? 0} />
        </div>

        <div>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-amethyst/60 mb-2">
            <span>Last 7 Days</span>
            <span className="text-emerald-300/80 normal-case tracking-normal">
              +{totalGained7d} XP
            </span>
          </div>
          {isLoading ? (
            <div className="h-16 rounded-md bg-white/5 animate-pulse" />
          ) : last7.length === 0 ? (
            <div className="text-white/40 text-xs italic">
              No history yet — daily summaries start appearing tomorrow.
            </div>
          ) : (
            <div className="flex items-end gap-1.5 h-16">
              {last7.map((l) => {
                const pct = ((l.xp_gained || 0) / maxGain) * 100;
                const day = new Date(l.log_date).toLocaleDateString(undefined, { weekday: 'short' });
                return (
                  <div key={l.id} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-white/5 rounded-sm flex items-end" style={{ height: '48px' }}>
                      <div
                        className={cn(
                          'w-full rounded-sm transition-all',
                          (l.xp_gained || 0) > 0
                            ? 'bg-gradient-to-t from-amethyst-glow to-emerald-300'
                            : 'bg-white/10'
                        )}
                        style={{ height: `${Math.max(pct, 4)}%` }}
                        title={`${day}: +${l.xp_gained || 0} XP · ${l.mood}`}
                      />
                    </div>
                    <span className="text-[9px] text-amethyst/50">{day[0]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </HudFrame>
    </GlassPanel>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-md bg-white/5 border border-white/10 py-2">
      <Icon size={14} className="mx-auto text-amethyst/70 mb-1" />
      <div className="text-white text-sm font-semibold">{value}</div>
      <div className="text-[9px] uppercase tracking-[0.2em] text-amethyst/50">{label}</div>
    </div>
  );
}