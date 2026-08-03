import React from 'react';
import { Link } from 'react-router-dom';
import { Sword, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function UpcomingQuests({ quests }) {
  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60">
          Upcoming Quests
        </h2>
        <Link to="/quests" className="text-[10px] text-amethyst flex items-center gap-0.5">
          All <ChevronRight size={12} />
        </Link>
      </div>
      {quests.length === 0 ? (
        <p className="text-white/40 text-xs py-3 text-center">
          No active quests — check the Missions page for new ones.
        </p>
      ) : (
        <div className="space-y-2">
          {quests.map((q) => (
            <div key={q.id} className="flex items-center gap-3 p-2.5 rounded-xl"
              style={{ background: 'hsla(255,30%,12%,0.5)', border: '1px solid hsla(280,50%,50%,0.15)' }}>
              <Sword size={14} className="text-amethyst shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">{q.title}</div>
                <div className="text-[9px] text-white/45">
                  {q.progress || 0}/{q.target_count || 1}
                  {q.expires_at && ` · ends ${format(new Date(q.expires_at), 'MMM d')}`}
                </div>
              </div>
              <span className="text-[9px] font-bold text-amber-300 shrink-0">+{q.xp_reward} XP</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}