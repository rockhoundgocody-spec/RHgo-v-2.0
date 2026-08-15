/**
 * Badges — Liquid Mineral Badges collection screen
 * 2-column grid, rarity filter tabs, detail modal, unlock animation.
 */
import React, { useState, useMemo } from 'react';
import { Award, Lock, CheckCircle2, X, Gem, Share2, Check, AlertCircle } from 'lucide-react';
import { buildSharePayload, executeShare } from '@/lib/shareAchievement';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import LiquidMineralBadge from '@/components/badges/LiquidMineralBadge.jsx';
import { COLOR_SCHEMES } from '@/components/badges/LiquidMineralBadge.jsx';
import BadgeUnlockAnimation from '@/components/badges/BadgeUnlockAnimation.jsx';
import BadgeMaterialPanel from '@/components/badges/BadgeMaterialPanel.jsx';
import { useBadgeAwarder } from '@/lib/useBadgeAwarder';

const RARITY_ORDER  = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const FILTER_TABS   = ['all', ...RARITY_ORDER];

const RARITY_PILL = {
  common:    'bg-white/8 text-white/50 border-white/12',
  uncommon:  'bg-emerald-900/30 text-emerald-300 border-emerald-400/30',
  rare:      'bg-sky-900/30 text-sky-300 border-sky-400/30',
  epic:      'bg-purple-900/30 text-purple-200 border-purple-400/35',
  legendary: 'bg-amber-900/30 text-amber-300 border-amber-400/40',
};

const RARITY_GLOW = {
  common: '', uncommon: '0 0 12px hsla(152,80%,45%,0.15)',
  rare: '0 0 18px hsla(200,90%,55%,0.18)',
  epic: '0 0 22px hsla(265,80%,60%,0.2)',
  legendary: '0 0 28px hsla(45,100%,55%,0.22)',
};

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ current, target, scheme }) {
  const pct = Math.min((current / target) * 100, 100);
  return (
    <div className="w-full mt-2.5">
      <div className="flex justify-between mb-1">
        <span className="text-[9px] text-white/28 uppercase tracking-wider">Progress</span>
        <span className="text-[9px] font-mono text-white/32">{current}/{target}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsla(265,40%,16%,0.6)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: scheme?.glow || '#c084fc',
            boxShadow: `0 0 6px ${scheme?.glow || '#c084fc'}`,
          }} />
      </div>
    </div>
  );
}

// ── Badge detail modal ────────────────────────────────────────────────────────
function BadgeDetailModal({ badge, earned, progress, onClose, onReplay }) {
  const [showMat, setShowMat] = useState(false);
  const [copied,  setCopied]  = useState(false);
  const scheme = COLOR_SCHEMES[badge.colorScheme] || COLOR_SCHEMES.amethyst;

  const badgeExtra = earned
    ? `🏆 I earned the "${badge.title}" badge (${badge.rarity})!`
    : `🎯 Working toward "${badge.title}" on RockHound-GO!`;

  const handleShare = async () => {
    const payload = buildSharePayload({ rank: badge.title, xp: null, extra: badgeExtra });
    // Override text for badge context — still includes url
    payload.text = `${badgeExtra}\n\nJoin me here:\nhttps://rhgo.base44.app`;
    const result = await executeShare(payload);
    if (result === 'clipboard') { setCopied(true); setTimeout(() => setCopied(false), 2200); }
    else if (result === 'error') { setCopied('error'); setTimeout(() => setCopied(false), 2200); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-4"
      style={{
        paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))',
        background: 'hsla(260,80%,3%,0.82)',
        backdropFilter: 'blur(10px)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-5 relative overflow-y-auto"
        style={{
          maxHeight: 'calc(100vh - 130px)',
          background: 'linear-gradient(165deg, hsla(265,42%,10%,0.99), hsla(240,30%,6%,0.99))',
          border: `1px solid ${scheme.rim}`,
          boxShadow: `0 -8px 60px ${scheme.glow.replace('0.9','0.18')}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition z-10">
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <LiquidMineralBadge badge={badge} size={136} locked={!earned} />

          <div className="mt-4 text-white font-bold text-[18px] leading-tight">{badge.title}</div>
          <div className={`text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border mt-2 ${RARITY_PILL[badge.rarity]}`}>
            {badge.rarity}
          </div>

          <p className="text-white/50 text-sm mt-3 leading-relaxed max-w-[260px]">{badge.description}</p>

          {earned ? (
            <div className="flex items-center gap-2 mt-3 text-emerald-400 text-sm font-semibold">
              <CheckCircle2 size={15} /> Earned
            </div>
          ) : (
            <div className="w-full max-w-[260px]">
              <ProgressBar current={progress.current} target={progress.target} scheme={scheme} />
            </div>
          )}

          <div className="flex gap-2 w-full mt-4 max-w-[260px]">
            <button onClick={handleShare}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition active:scale-95"
              style={{ background: 'hsla(195,80%,14%,0.55)', border: `1px solid ${scheme.rim}`, color: scheme.secondary }}>
              {copied === 'error' ? '⚠ Failed' : copied ? '✓ Copied!' : '🔗 Share'}
            </button>
          </div>

          <button onClick={() => setShowMat(v => !v)}
            className="mt-3 text-[10px] uppercase tracking-wider text-white/28 hover:text-white/60 transition">
            {showMat ? '▲ Hide' : '▼'} Material Breakdown
          </button>

          {showMat && (
            <div className="w-full mt-3">
              <BadgeMaterialPanel badge={badge} />
            </div>
          )}

          {earned && (
            <button onClick={() => { onReplay(); onClose(); }}
              className="mt-4 w-full max-w-[260px] py-3 rounded-xl text-sm font-bold transition active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${scheme.primary}, ${scheme.secondary})`,
                color: 'hsl(255,60%,10%)',
                boxShadow: `0 0 20px ${scheme.glow.replace('0.9','0.45')}`,
              }}>
              ✨ Replay Unlock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Badge grid card ───────────────────────────────────────────────────────────
function BadgeCard({ badge, earned, onClick }) {
  const scheme = COLOR_SCHEMES[badge.colorScheme] || COLOR_SCHEMES.amethyst;
  return (
    <div
      onClick={onClick}
      className="rounded-3xl p-4 cursor-pointer transition-all duration-200 active:scale-95 hover:scale-[1.02] flex flex-col items-center"
      style={{
        background: earned
          ? 'linear-gradient(145deg, hsla(265,38%,13%,0.96), hsla(250,30%,8%,0.98))'
          : 'linear-gradient(145deg, hsla(255,25%,10%,0.88), hsla(240,20%,7%,0.92))',
        border: earned
          ? `1px solid ${scheme.rim.replace('0.6','0.35')}`
          : '1px solid hsla(255,25%,22%,0.2)',
        boxShadow: earned ? RARITY_GLOW[badge.rarity] : 'none',
      }}
    >
      <LiquidMineralBadge badge={badge} size={90} locked={!earned} />

      <div className="text-white text-[12px] font-bold mt-3 text-center leading-tight line-clamp-2 w-full">
        {badge.title}
      </div>

      <div className={`text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full border mt-2 ${RARITY_PILL[badge.rarity]}`}>
        {earned
          ? badge.rarity
          : <span className="flex items-center gap-1"><Lock size={7} /> locked</span>
        }
      </div>

      <p className="text-white/38 text-[10px] mt-2 text-center leading-snug line-clamp-2 w-full">
        {badge.description}
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Badges() {
  const { earnedCodes, pendingBadge, dismissPending, allBadges } = useBadgeAwarder();
  const [selected,     setSelected]     = useState(null);
  const [replayBadge,  setReplayBadge]  = useState(null);
  const [rarityFilter, setRarityFilter] = useState('all');
  const [pageCopied,   setPageCopied]   = useState(false);

  const earnedCount = allBadges.filter((b) => earnedCodes.has(b.code)).length;

  const handleShareProgress = async () => {
    const pct = Math.round((earnedCount / allBadges.length) * 100);
    const { executeShare } = await import('@/lib/shareAchievement');
    const result = await executeShare({
      title: 'RockHound-GO Challenge',
      text: `🏆 I've earned ${earnedCount}/${allBadges.length} badges (${pct}%) on RockHound-GO! Can you beat my collection?\n\nJoin me here:\nhttps://rhgo.base44.app`,
      url: 'https://rhgo.base44.app',
    });
    if (result === 'clipboard') { setPageCopied('copied'); setTimeout(() => setPageCopied(false), 2200); }
    else if (result === 'error') { setPageCopied('error'); setTimeout(() => setPageCopied(false), 2200); }
  };

  // Memoize filtered and sorted badge list to avoid redundant array filtering, sorting,
  // and re-allocation on unrelated component state updates (e.g. modal open/close, copy state).
  const sorted = useMemo(() => {
    const filtered = rarityFilter === 'all'
      ? allBadges
      : allBadges.filter((b) => b.rarity === rarityFilter);

    return [...filtered].sort((a, b) => {
      // Earned first, then by rarity desc
      const ae = earnedCodes.has(a.code) ? 0 : 1;
      const be = earnedCodes.has(b.code) ? 0 : 1;
      if (ae !== be) return ae - be;
      return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
    });
  }, [rarityFilter, allBadges, earnedCodes]);

  return (
    <div
      className="px-4 pt-6 max-w-md mx-auto w-full"
      style={{ paddingBottom: 'calc(160px + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* ── Header ── */}
      <div className="mb-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Gem size={16} className="text-amethyst-glow" />
          <h1 className="text-2xl font-black text-white tracking-wide">Liquid Mineral Codex</h1>
        </div>
        <p className="text-amethyst/55 text-[10px] uppercase tracking-[0.35em]">Collectible Field Achievements</p>
      </div>

      {/* ── Stats strip ── */}
      <GlassPanel className="mb-5">
        <div className="grid grid-cols-3 divide-x divide-white/8 text-center py-4">
          <div>
            <div className="text-[26px] font-black text-white"
              style={{ textShadow: '0 0 18px hsla(280,100%,70%,0.6)' }}>
              {earnedCount}
            </div>
            <div className="text-[9px] uppercase tracking-[0.25em] text-amethyst/50 mt-0.5">Earned</div>
          </div>
          <div>
            <div className="text-[26px] font-black text-white/55">{allBadges.length - earnedCount}</div>
            <div className="text-[9px] uppercase tracking-[0.25em] text-amethyst/50 mt-0.5">Locked</div>
          </div>
          <div>
            <div className="text-[26px] font-black text-amber-300">{allBadges.length}</div>
            <div className="text-[9px] uppercase tracking-[0.25em] text-amethyst/50 mt-0.5">Total</div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="px-5 pb-4">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'hsla(265,40%,16%,0.6)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(earnedCount / allBadges.length) * 100}%`,
                background: 'linear-gradient(90deg, hsl(265,70%,55%), hsl(280,100%,72%), hsl(48,100%,62%))',
                boxShadow: '0 0 8px hsla(280,100%,70%,0.5)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-white/25">Collection Progress</span>
            <span className="text-[9px] font-mono text-white/30">
              {Math.round((earnedCount / allBadges.length) * 100)}%
            </span>
          </div>
        </div>

        {/* Share progress button */}
        <div className="px-5 pb-4">
          <button
            onClick={handleShareProgress}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition active:scale-95"
            style={{
              background: 'hsla(265,60%,14%,0.55)',
              border: '1px solid hsla(280,60%,55%,0.3)',
              color: 'hsl(280,100%,85%)',
            }}
          >
            {pageCopied === 'error' ? <><AlertCircle size={13} /> Share failed — try again</>
             : pageCopied ? <><Check size={13} /> Challenge copied — paste it anywhere</>
             : <><Share2 size={13} /> Share My Badge Progress</>}
          </button>
        </div>
      </GlassPanel>

      {/* ── Rarity filter tabs ── */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTER_TABS.map((r) => {
          const active = rarityFilter === r;
          return (
            <button key={r} onClick={() => setRarityFilter(r)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all ${
                active
                  ? r === 'all'
                    ? 'bg-white/15 text-white border-white/30'
                    : RARITY_PILL[r]
                  : 'bg-white/4 text-white/32 border-white/8 hover:bg-white/10'
              }`}>
              {r === 'all' ? `All (${allBadges.length})` : r}
            </button>
          );
        })}
      </div>

      {/* ── Badge grid — 2 columns ── */}
      <div className="grid grid-cols-2 gap-3">
        {sorted.map((b) => {
          const earned = earnedCodes.has(b.code);
          const prog   = b.progress ? b.progress([]) : { current: 0, target: 1 };
          return (
            <BadgeCard
              key={b.code}
              badge={b}
              earned={earned}
              onClick={() => setSelected(b)}
              progress={prog}
            />
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className="mt-12 text-center text-white/38 text-sm">
          <Award className="mx-auto mb-2 text-amethyst/30" size={24} />
          <p className="font-semibold mb-1">No entries in this codex tier yet.</p>
          <p className="text-white/25 text-xs">Every scan, verify, and expedition unlocks your path here.</p>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <BadgeDetailModal
          badge={selected}
          earned={earnedCodes.has(selected.code)}
          progress={selected.progress ? selected.progress([]) : { current: 0, target: 1 }}
          onClose={() => setSelected(null)}
          onReplay={() => setReplayBadge(selected)}
        />
      )}

      {/* Replay animation */}
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