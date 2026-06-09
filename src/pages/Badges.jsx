/**
 * Badges page — Liquid Mineral Badges system
 * Shows all 18 badges in a 2-col grid with rarity filtering,
 * detail modal (material breakdown + share), and unlock animation.
 */
import React, { useState } from 'react';
import { Award, X, Lock, CheckCircle2 } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import LiquidMineralBadge from '@/components/badges/LiquidMineralBadge.jsx';
import BadgeUnlockAnimation from '@/components/badges/BadgeUnlockAnimation.jsx';
import BadgeMaterialPanel from '@/components/badges/BadgeMaterialPanel.jsx';
import { COLOR_SCHEMES } from '@/components/badges/LiquidMineralBadge.jsx';
import { useBadgeAwarder } from '@/lib/useBadgeAwarder';

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const FILTER_TABS  = ['all', ...RARITY_ORDER];

const RARITY_PILL = {
  common:    'bg-white/10 text-white/55 border-white/15',
  uncommon:  'bg-emerald-900/30 text-emerald-300 border-emerald-400/30',
  rare:      'bg-sky-900/30 text-sky-300 border-sky-400/30',
  epic:      'bg-purple-900/30 text-amethyst-glow border-amethyst/40',
  legendary: 'bg-amber-900/30 text-amber-300 border-amber-400/40',
};

// ── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, target, scheme }) {
  const pct = Math.min((current / target) * 100, 100);
  return (
    <div className="w-full mt-2">
      <div className="flex justify-between mb-0.5">
        <span className="text-[9px] text-white/30 uppercase tracking-wider">Progress</span>
        <span className="text-[9px] font-mono text-white/35">{current}/{target}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsla(265,40%,18%,0.5)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: scheme?.glow || '#c084fc', boxShadow: `0 0 6px ${scheme?.glow || '#c084fc'}` }} />
      </div>
    </div>
  );
}

// ── Detail modal ─────────────────────────────────────────────────────────────
function BadgeDetailModal({ badge, earned, progress, onClose, onReplay }) {
  const [showMat, setShowMat] = useState(false);
  const [copied, setCopied] = useState(false);
  const scheme = COLOR_SCHEMES[badge.colorScheme] || COLOR_SCHEMES.amethyst;

  const shareText = earned
    ? `🏆 I earned the "${badge.title}" badge on RockHound-GO! (${badge.rarity})`
    : `🎯 Working toward "${badge.title}" on RockHound-GO!`;

  const handleShare = (e) => {
    e.stopPropagation();
    if (navigator.share) { navigator.share({ title: 'RockHound-GO Badge', text: shareText }); }
    else { navigator.clipboard.writeText(shareText); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-4"
      style={{
        paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
        background: 'hsla(260,80%,4%,0.78)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-5 relative overflow-y-auto"
        style={{
          maxHeight: 'calc(100vh - 140px)',
          background: 'linear-gradient(160deg, hsla(265,42%,11%,0.99), hsla(240,30%,7%,0.99))',
          border: `1px solid ${scheme.rim}`,
          boxShadow: `0 -8px 60px ${scheme.glow.replace('0.9','0.2')}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition">
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <LiquidMineralBadge badge={badge} size={130} locked={!earned} />

          <div className="mt-4 text-white font-bold text-lg">{badge.title}</div>

          <div className={`text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full border mt-1.5 ${RARITY_PILL[badge.rarity]}`}>
            {badge.rarity}
          </div>

          <p className="text-white/50 text-sm mt-3 leading-relaxed">{badge.description}</p>

          {earned ? (
            <div className="flex items-center gap-2 mt-3 text-emerald-400 text-sm font-semibold">
              <CheckCircle2 size={15} /> Earned
            </div>
          ) : (
            <ProgressBar current={progress.current} target={progress.target} scheme={scheme} />
          )}

          {/* Share buttons */}
          <div className="flex gap-2 w-full mt-4" aria-label="Badge sharing options">
            <button onClick={handleShare} aria-label="Share badge"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition active:scale-95"
              style={{ background: 'hsla(195,80%,18%,0.5)', border: `1px solid ${scheme.rim}`, color: scheme.secondary }}>
              🔗 Share
            </button>
            <button onClick={handleCopy} aria-label="Copy badge text"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition active:scale-95"
              style={{ background: 'hsla(265,60%,18%,0.5)', border: `1px solid ${scheme.rim}`, color: scheme.secondary }}>
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>

          {/* Material breakdown toggle */}
          <button
            onClick={() => setShowMat((v) => !v)}
            className="mt-3 text-[10px] uppercase tracking-wider text-white/30 hover:text-white/60 transition"
          >
            {showMat ? '▲ Hide' : '▼ View'} Material Breakdown
          </button>

          {showMat && (
            <div className="w-full mt-3">
              <BadgeMaterialPanel badge={badge} />
            </div>
          )}

          {/* Replay */}
          {earned && (
            <button
              onClick={(e) => { e.stopPropagation(); onReplay(); }}
              className="mt-4 w-full py-3 rounded-xl text-sm font-bold transition active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${scheme.primary}, ${scheme.secondary})`,
                color: 'hsl(255,60%,10%)',
                boxShadow: `0 0 18px ${scheme.glow.replace('0.9','0.45')}`,
              }}
            >
              Replay Unlock ✨
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Badges() {
  const { earnedCodes, pendingBadge, dismissPending, allBadges } = useBadgeAwarder();
  const [selected, setSelected] = useState(null);
  const [replayBadge, setReplayBadge] = useState(null);
  const [rarityFilter, setRarityFilter] = useState('all');

  const earnedCount = allBadges.filter((b) => earnedCodes.has(b.code)).length;

  const filtered = rarityFilter === 'all' ? allBadges : allBadges.filter((b) => b.rarity === rarityFilter);
  const sorted = [...filtered].sort((a, b) => {
    const ae = earnedCodes.has(a.code) ? 0 : 1;
    const be = earnedCodes.has(b.code) ? 0 : 1;
    if (ae !== be) return ae - be;
    return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
  });

  return (
    <div
      className="px-4 pt-6 max-w-md mx-auto"
      style={{ paddingBottom: 'calc(140px + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* Header */}
      <div className="mb-5 text-center">
        <h1 className="text-2xl font-bold text-white tracking-wide">Badges</h1>
        <p className="text-amethyst/60 text-xs uppercase tracking-[0.3em] mt-1">Liquid Mineral Achievements</p>
      </div>

      {/* Stats strip */}
      <GlassPanel className="mb-5">
        <div className="grid grid-cols-3 divide-x divide-white/10 text-center py-4">
          <div>
            <div className="text-2xl font-bold text-white" style={{ textShadow: '0 0 14px hsla(280,100%,70%,0.6)' }}>{earnedCount}</div>
            <div className="text-[9px] uppercase tracking-[0.25em] text-amethyst/55 mt-0.5">Earned</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white/60">{allBadges.length - earnedCount}</div>
            <div className="text-[9px] uppercase tracking-[0.25em] text-amethyst/55 mt-0.5">Locked</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-300">{allBadges.length}</div>
            <div className="text-[9px] uppercase tracking-[0.25em] text-amethyst/55 mt-0.5">Total</div>
          </div>
        </div>
      </GlassPanel>

      {/* Rarity filter tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_TABS.map((r) => {
          const active = rarityFilter === r;
          return (
            <button key={r} onClick={() => setRarityFilter(r)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all ${
                active
                  ? (r === 'all' ? 'bg-white/15 text-white border-white/30' : RARITY_PILL[r])
                  : 'bg-white/5 text-white/35 border-white/10 hover:bg-white/10'
              }`}>
              {r}
            </button>
          );
        })}
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 gap-4">
        {sorted.map((b) => {
          const earned = earnedCodes.has(b.code);
          const scheme = COLOR_SCHEMES[b.colorScheme] || COLOR_SCHEMES.amethyst;
          const prog = b.progress ? b.progress([]) : { current: 0, target: 1 };
          return (
            <GlassPanel
              key={b.code}
              className="p-4 cursor-pointer hover:scale-[1.02] transition-transform active:scale-95"
              onClick={() => setSelected(b)}
              style={earned ? { boxShadow: `0 0 22px ${scheme.glow.replace('0.9','0.2')}` } : {}}
            >
              <div className="flex flex-col items-center">
                <LiquidMineralBadge badge={b} size={96} locked={!earned} />
                <div className="text-white text-sm font-semibold mt-3 text-center truncate w-full">
                  {b.title}
                </div>
                <div className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border mt-1.5 ${RARITY_PILL[b.rarity]}`}>
                  {earned ? b.rarity : <span className="flex items-center gap-1"><Lock size={7} /> locked</span>}
                </div>
                <p className="text-white/45 text-[10px] mt-2 text-center leading-snug line-clamp-2">
                  {b.description}
                </p>
                {!earned && (
                  <ProgressBar current={prog.current} target={prog.target} scheme={scheme} />
                )}
              </div>
            </GlassPanel>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className="mt-10 text-center text-white/40 text-sm">
          <Award className="mx-auto mb-2 text-amethyst/30" size={24} />
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

      {/* Replay */}
      {replayBadge && (
        <BadgeUnlockAnimation badge={replayBadge} onClose={() => setReplayBadge(null)} />
      )}

      {/* Auto-trigger for newly earned */}
      {pendingBadge && (
        <BadgeUnlockAnimation badge={pendingBadge} onClose={dismissPending} />
      )}
    </div>
  );
}