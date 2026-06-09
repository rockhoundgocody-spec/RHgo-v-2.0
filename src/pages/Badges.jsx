import React, { useState } from 'react';
import { Award, X, Lock, CheckCircle2, Share2, Copy, Check } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import LiquidCrystalBadge from '@/components/badges/LiquidCrystalBadge.jsx';
import BadgeUnlockOverlay from '@/components/badges/BadgeUnlockOverlay.jsx';
import { useBadgeAwarder } from '@/lib/useBadgeAwarder';

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const RARITY_STYLE = {
  common:    { label: 'text-white/60',      border: 'border-white/15',      pill: 'bg-white/10 text-white/60 border-white/20' },
  uncommon:  { label: 'text-emerald-300',   border: 'border-emerald-400/30', pill: 'bg-emerald-900/30 text-emerald-300 border-emerald-400/30' },
  rare:      { label: 'text-sky-300',       border: 'border-sky-400/30',    pill: 'bg-sky-900/30 text-sky-300 border-sky-400/30' },
  epic:      { label: 'text-amethyst-glow', border: 'border-amethyst/40',   pill: 'bg-purple-900/30 text-amethyst-glow border-amethyst/40' },
  legendary: { label: 'text-amber-300',     border: 'border-amber-400/40',  pill: 'bg-amber-900/30 text-amber-300 border-amber-400/40' },
};

const FILTER_TABS = ['all', ...RARITY_ORDER];

function ProgressBar({ current, target, rarity }) {
  const pct = Math.min((current / target) * 100, 100);
  const colors = {
    common: '#ffffff60', uncommon: '#6ee7b7', rare: '#7dd3fc',
    epic: '#c084fc', legendary: '#fcd34d',
  };
  return (
    <div className="w-full mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[9px] text-white/30 uppercase tracking-wider">Progress</span>
        <span className="text-[9px] text-white/40">{current}/{target}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsla(265,40%,20%,0.5)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: colors[rarity] || '#ffffff60' }}
        />
      </div>
    </div>
  );
}

function ShareBadgeButtons({ badge }) {
  const [copied, setCopied] = useState(false);
  const text = `🏆 I earned the "${badge.title}" badge on RockHound-GO! (${badge.rarity})`;
  const handleShare = () => {
    if (navigator.share) { navigator.share({ title: 'RockHound-GO Badge', text }); }
    else { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="flex gap-2 w-full mt-3">
      <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition active:scale-95"
        style={{ background: 'hsla(195,80%,20%,0.5)', border: '1px solid hsla(195,80%,55%,0.35)', color: 'hsl(195,100%,82%)' }}>
        <Share2 size={12} /> Share
      </button>
      <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition active:scale-95"
        style={{ background: 'hsla(265,60%,20%,0.5)', border: '1px solid hsla(280,60%,55%,0.35)', color: 'hsl(280,100%,90%)' }}>
        {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
      </button>
    </div>
  );
}

function BadgeDetailModal({ badge, earned, progress, onClose, onReplay }) {
  const style = RARITY_STYLE[badge.rarity] || RARITY_STYLE.common;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4"
      style={{ background: 'hsla(260,80%,5%,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 relative"
        style={{ background: 'linear-gradient(160deg, hsla(265,40%,12%,0.98), hsla(240,30%,8%,0.99))', border: '1px solid hsla(280,60%,50%,0.25)', boxShadow: '0 -8px 60px hsla(265,80%,55%,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition">
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <LiquidCrystalBadge rarity={badge.rarity} icon={badge.icon} size={120} locked={!earned} />

          <div className="mt-4 text-white font-bold text-lg">{badge.title}</div>

          <div className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border mt-2 ${style.pill}`}>
            {badge.rarity}
          </div>

          <p className="text-white/50 text-sm mt-3 leading-relaxed">
            {earned ? badge.description : badge.description}
          </p>

          <div className="w-full mt-1">
            {earned ? (
              <div className="flex items-center justify-center gap-2 mt-3 text-emerald-400 text-sm font-semibold">
                <CheckCircle2 size={16} /> Earned
              </div>
            ) : (
              <div className="mt-2 w-full">
                <ProgressBar current={progress.current} target={progress.target} rarity={badge.rarity} />
              </div>
            )}
          </div>

          {earned && (
            <>
              <ShareBadgeButtons badge={badge} />
              <button
                onClick={onReplay}
                className="mt-3 w-full py-3 rounded-xl text-sm font-bold transition active:scale-95"
                style={{ background: 'linear-gradient(135deg, hsl(265,70%,55%), hsl(280,90%,65%))', color: 'white' }}
              >
                Replay Unlock ✨
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Badges() {
  const { earnedCodes, pendingBadge, dismissPending, allBadges } = useBadgeAwarder();
  const [selected, setSelected] = useState(null);
  const [replayBadge, setReplayBadge] = useState(null);
  const [rarityFilter, setRarityFilter] = useState('all');

  const earnedCount = allBadges.filter((b) => earnedCodes.has(b.code)).length;

  const filtered = rarityFilter === 'all'
    ? allBadges
    : allBadges.filter((b) => b.rarity === rarityFilter);

  // Sort: earned first, then by rarity order
  const sorted = [...filtered].sort((a, b) => {
    const ae = earnedCodes.has(a.code) ? 0 : 1;
    const be = earnedCodes.has(b.code) ? 0 : 1;
    if (ae !== be) return ae - be;
    return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
  });

  return (
    <div className="px-4 pt-6 pb-28 max-w-md mx-auto min-h-screen overflow-y-auto">
      {/* Header */}
      <div className="mb-5 text-center">
        <h1 className="text-2xl font-bold text-white tracking-wide">Badges</h1>
        <p className="text-amethyst/60 text-xs uppercase tracking-[0.3em] mt-1">Achievements</p>
      </div>

      {/* Stats */}
      <GlassPanel className="mb-5">
        <div className="grid grid-cols-2 divide-x divide-white/10 text-center py-4">
          <div>
            <div className="text-2xl font-bold text-white glow-amethyst">{earnedCount}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-amethyst/60 mt-1">Earned</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white/70">{allBadges.length - earnedCount}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-amethyst/60 mt-1">Locked</div>
          </div>
        </div>
      </GlassPanel>

      {/* Rarity filter tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_TABS.map((r) => {
          const active = rarityFilter === r;
          const style = r === 'all' ? null : RARITY_STYLE[r];
          return (
            <button
              key={r}
              onClick={() => setRarityFilter(r)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                active
                  ? (style ? style.pill : 'bg-white/15 text-white border-white/30')
                  : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
              }`}
            >
              {r}
            </button>
          );
        })}
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 gap-4">
        {sorted.map((b) => {
          const earned = earnedCodes.has(b.code);
          const prog = b.progress ? b.progress([]) : { current: 0, target: 1 };
          // We don't have specimens here, so progress shows 0 for locked — detail modal has full data
          const style = RARITY_STYLE[b.rarity] || RARITY_STYLE.common;
          return (
            <GlassPanel
              key={b.code}
              className="p-4 cursor-pointer hover:scale-[1.02] transition-transform active:scale-95"
              onClick={() => setSelected(b)}
            >
              <div className="flex flex-col items-center">
                <LiquidCrystalBadge rarity={b.rarity} icon={b.icon} size={100} locked={!earned} />
                <div className="text-white text-sm font-semibold mt-3 text-center truncate w-full">
                  {b.title}
                </div>
                <div className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border mt-1.5 ${style.pill}`}>
                  {earned ? b.rarity : (
                    <span className="flex items-center gap-1"><Lock size={8} /> locked</span>
                  )}
                </div>
                <p className="text-white/50 text-[11px] mt-2 text-center leading-snug line-clamp-2">
                  {b.description}
                </p>
                {!earned && b.progress && (
                  <ProgressBar current={0} target={b.progress([]).target} rarity={b.rarity} />
                )}
              </div>
            </GlassPanel>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className="mt-8 text-center text-white/50 text-sm">
          <Award className="mx-auto mb-2 text-amethyst/40" size={24} />
          No badges in this category yet.
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <BadgeDetailModal
          badge={selected}
          earned={earnedCodes.has(selected.code)}
          progress={selected.progress ? selected.progress([]) : { current: 0, target: 1 }}
          onClose={() => setSelected(null)}
          onReplay={() => { setReplayBadge(selected); setSelected(null); }}
        />
      )}

      {/* Replay overlay */}
      {replayBadge && (
        <BadgeUnlockOverlay badge={replayBadge} onClose={() => setReplayBadge(null)} />
      )}

      {/* Auto-trigger overlay for newly earned */}
      {pendingBadge && (
        <BadgeUnlockOverlay badge={pendingBadge} onClose={dismissPending} />
      )}
    </div>
  );
}