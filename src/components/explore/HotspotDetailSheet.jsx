/**
 * HotspotDetailSheet — Full bottom sheet when a hotspot pin is tapped.
 * Shows: rock types, difficulty, recent finds, collectible badge rewards,
 * collection gap indicator, and Log a Find CTA.
 *
 * All hooks are called unconditionally before any early return.
 */
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, MapPin, Award, Star, Shield, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BADGES } from '@/lib/badgeDefinitions.js';
import LiquidMineralBadge from '@/components/badges/LiquidMineralBadge.jsx';
import { base44 } from '@/api/base44Client';

const LAND_LABEL = {
  public:         { label: 'Public Land',      color: '#34d399' },
  blm:            { label: 'BLM Land',         color: '#fbbf24' },
  forest_service: { label: 'National Forest',  color: '#a3e635' },
  state_park:     { label: 'State Park',       color: '#38bdf8' },
  private:        { label: 'Private Land',     color: '#fb7185' },
  unknown:        { label: 'Unknown',          color: '#94a3b8' },
};

const DIFF_CONFIG = {
  easy:     { color: '#34d399', label: 'Easy',     stars: 1 },
  moderate: { color: '#fbbf24', label: 'Moderate', stars: 2 },
  hard:     { color: '#f97316', label: 'Hard',     stars: 3 },
  expert:   { color: '#fb7185', label: 'Expert',   stars: 4 },
};

const MINERAL_RARITY = {
  tourmaline: 'rare', topaz: 'rare', sapphire: 'legendary', emerald: 'legendary',
  ruby: 'legendary', amethyst: 'uncommon', quartz: 'common', feldspar: 'common',
  mica: 'common', garnet: 'uncommon', obsidian: 'uncommon', jasper: 'common',
};

function MineralPill({ mineral }) {
  const rarity = MINERAL_RARITY[mineral.toLowerCase()] || 'common';
  const colors = {
    common:    { bg: 'hsla(220,30%,20%,0.7)',  text: '#94a3b8', border: 'hsla(220,30%,40%,0.3)' },
    uncommon:  { bg: 'hsla(160,40%,14%,0.7)',  text: '#34d399', border: 'hsla(160,60%,40%,0.3)' },
    rare:      { bg: 'hsla(210,60%,14%,0.7)',  text: '#38bdf8', border: 'hsla(210,80%,50%,0.35)' },
    legendary: { bg: 'hsla(45,60%,14%,0.7)',   text: '#f59e0b', border: 'hsla(45,90%,50%,0.4)'  },
  };
  const c = colors[rarity];
  return (
    <span
      className="flex-shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {mineral}
      {rarity !== 'common' && <span className="ml-1 opacity-60">· {rarity}</span>}
    </span>
  );
}

function DifficultyStars({ difficulty }) {
  const cfg = DIFF_CONFIG[difficulty] || DIFF_CONFIG.moderate;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4].map(i => (
          <Star
            key={i}
            size={10}
            fill={i <= cfg.stars ? cfg.color : 'transparent'}
            color={i <= cfg.stars ? cfg.color : 'rgba(255,255,255,0.2)'}
          />
        ))}
      </div>
      <span className="text-[10px] font-semibold" style={{ color: cfg.color }}>
        {cfg.label}
      </span>
    </div>
  );
}

export default function HotspotDetailSheet({
  hotspot,
  specimens = [],
  earnedCodes = new Set(),
  collectionGapMinerals = [],
  onClose,
}) {
  // ── ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURN ──────────────────────

  const land = LAND_LABEL[hotspot?.land_type] || LAND_LABEL.unknown;
  const isPublic = ['public','blm','forest_service','state_park'].includes(hotspot?.land_type);

  // Badge relevance — computed unconditionally
  const { earnable, earned } = useMemo(() => {
    const relevant = BADGES.filter(b =>
      ['trailblazer', 'pathfinder', 'perfect_strike', 'hotspot_regular',
       'hotspot_master', 'vein_tracker', 'rare_seeker', 'legendary_strike',
       'first_find', 'archivist_25', 'earth_chosen'].includes(b.code)
    );
    const earned   = relevant.filter(b => earnedCodes.has(b.code));
    const earnable = relevant.filter(b => !earnedCodes.has(b.code)).slice(0, 3);
    return { earnable, earned };
  }, [earnedCodes]);

  // Recent finds at this hotspot — computed unconditionally
  const recentFinds = useMemo(() => {
    if (!hotspot) return [];
    return specimens
      .filter(s => {
        const loc  = (s.found_at || '').toLowerCase();
        const name = (hotspot.name || '').toLowerCase();
        return loc.includes(name.slice(0, 6)) ||
          (hotspot.minerals || []).some(m =>
            (s.mineral_name || '').toLowerCase() === m.toLowerCase()
          );
      })
      .slice(-5)
      .reverse();
  }, [specimens, hotspot]);

  // Track hotspot discovery view
  useEffect(() => {
    if (!hotspot) return;
    base44.analytics.track({
      eventName: 'hotspot_discovered',
      properties: {
        hotspot_name: hotspot.name,
        land_type: hotspot.land_type || 'unknown',
        difficulty: hotspot.difficulty || 'unknown',
        state: hotspot.state || 'unknown',
        minerals_count: (hotspot.minerals || []).length,
        has_collection_gap: collectionGapMinerals.length > 0,
      },
    });
  }, [hotspot?.id]);

  // ── EARLY RETURN after all hooks ──────────────────────────────────────────
  if (!hotspot) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="detail"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="absolute bottom-0 inset-x-0 z-[2000] rounded-t-3xl overflow-hidden"
        style={{
          maxHeight: '80vh',
          background: 'linear-gradient(180deg, hsla(245,32%,10%,0.99) 0%, hsla(240,26%,6%,1) 100%)',
          backdropFilter: 'blur(40px)',
          border: '1px solid hsla(270,30%,40%,0.25)',
          borderBottom: 'none',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>

        <div
          className="overflow-y-auto"
          style={{
            maxHeight: 'calc(80vh - 20px)',
            paddingBottom: 'calc(110px + env(safe-area-inset-bottom,0px))',
          }}
        >
          {/* ── Header ── */}
          <div className="px-5 pt-2 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-lg leading-tight truncate">{hotspot.name}</h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span
                    className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border"
                    style={{ color: land.color, borderColor: `${land.color}55`, background: `${land.color}12` }}
                  >
                    {land.label}
                  </span>
                  {hotspot.state && (
                    <span className="text-[10px] text-white/35 uppercase tracking-wider">
                      {hotspot.state}
                    </span>
                  )}
                  {!isPublic && (
                    <div className="flex items-center gap-1 text-amber-400/80">
                      <AlertTriangle size={10} />
                      <span className="text-[9px]">Permission required</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'hsla(255,30%,20%,0.5)', border: '1px solid hsla(255,30%,40%,0.2)' }}
              >
                <X size={14} className="text-white/60" />
              </button>
            </div>

            {/* Difficulty + Trust */}
            <div className="flex items-center gap-4 mt-3">
              {hotspot.difficulty && <DifficultyStars difficulty={hotspot.difficulty} />}
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: `hsl(${Math.round((hotspot.trust_score || 0.5) * 120)},80%,55%)`,
                    boxShadow: `0 0 6px hsl(${Math.round((hotspot.trust_score || 0.5) * 120)},80%,55%,0.6)`,
                  }}
                />
                <span className="text-[10px] text-white/40 font-mono">
                  {((hotspot.trust_score || 0) * 100).toFixed(0)}% trust
                </span>
              </div>
            </div>
          </div>

          {/* ── Minerals ── */}
          {hotspot.minerals?.length > 0 && (
            <div className="px-5 mb-4">
              <div className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-2">Rock Types</div>
              <div className="flex flex-wrap gap-1.5">
                {hotspot.minerals.map(m => <MineralPill key={m} mineral={m} />)}
              </div>
            </div>
          )}

          {/* ── Collection gap alert ── */}
          {collectionGapMinerals.length > 0 && (
            <div className="mx-5 mb-4 px-4 py-3 rounded-2xl"
              style={{ background: 'hsla(280,60%,16%,0.8)', border: '1px solid hsla(280,70%,50%,0.35)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amethyst-glow animate-pulse" />
                <span className="text-[10px] font-bold text-amethyst-glow uppercase tracking-wider">
                  Collection Gap Detected
                </span>
              </div>
              <p className="text-white/60 text-xs leading-relaxed">
                You're missing:{' '}
                <span className="text-amethyst-glow font-semibold">
                  {collectionGapMinerals.slice(0, 3).join(', ')}
                </span>
                {collectionGapMinerals.length > 3 && ` + ${collectionGapMinerals.length - 3} more`}
              </p>
            </div>
          )}

          {/* ── Description & Rules ── */}
          {hotspot.description && (
            <div className="px-5 mb-4">
              <p className="text-white/45 text-xs leading-relaxed">{hotspot.description}</p>
            </div>
          )}
          {hotspot.rules && (
            <div className="mx-5 mb-4 px-3 py-2.5 rounded-xl"
              style={{ background: 'hsla(45,70%,18%,0.5)', border: '1px solid hsla(45,80%,45%,0.25)' }}>
              <div className="flex items-start gap-2">
                <Shield size={11} className="text-amber-400/80 mt-0.5 flex-shrink-0" />
                <p className="text-amber-300/70 text-[11px] leading-relaxed">{hotspot.rules}</p>
              </div>
            </div>
          )}

          {/* ── Recent finds ── */}
          {recentFinds.length > 0 && (
            <div className="px-5 mb-4">
              <div className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-2">
                Recent Finds ({recentFinds.length})
              </div>
              <div className="space-y-1.5">
                {recentFinds.map(s => (
                  <div key={s.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl"
                    style={{ background: 'hsla(255,25%,14%,0.7)', border: '1px solid hsla(255,30%,30%,0.2)' }}>
                    {s.image_url
                      ? <img src={s.image_url} alt={s.mineral_name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      : <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                          style={{ background: 'hsla(265,40%,18%,0.8)' }}>🪨</div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-semibold truncate">{s.mineral_name}</div>
                      {s.found_date && <div className="text-white/30 text-[9px]">{s.found_date}</div>}
                    </div>
                    {s.rarity && s.rarity !== 'common' && (
                      <span className="text-[9px] font-bold text-amethyst-glow">{s.rarity}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Badge rewards ── */}
          {(earnable.length > 0 || earned.length > 0) && (
            <div className="px-5 mb-4">
              <div className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-2 flex items-center gap-2">
                <Award size={10} />
                Badge Rewards
              </div>
              <div className="flex gap-3 flex-wrap">
                {earned.map(b => (
                  <div key={b.code} className="flex flex-col items-center gap-1">
                    <div className="relative">
                      <LiquidMineralBadge badge={b} size={48} locked={false} />
                      <CheckCircle2 size={14} className="absolute -bottom-1 -right-1 text-emerald-400 bg-background rounded-full" />
                    </div>
                    <span className="text-[8px] text-emerald-400/80 text-center w-12 leading-tight">{b.title}</span>
                  </div>
                ))}
                {earnable.map(b => (
                  <div key={b.code} className="flex flex-col items-center gap-1 opacity-55">
                    <LiquidMineralBadge badge={b} size={48} locked={true} />
                    <span className="text-[8px] text-white/40 text-center w-12 leading-tight">{b.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CTA ── */}
          <div className="px-5 mb-2">
            <Link
              to="/scan"
              onClick={() => base44.analytics.track({
                eventName: 'hotspot_log_find_tapped',
                properties: {
                  hotspot_name: hotspot.name,
                  land_type: hotspot.land_type || 'unknown',
                  state: hotspot.state || 'unknown',
                },
              })}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-bold tracking-wide transition-all active:scale-98"
              style={{
                background: 'linear-gradient(135deg, hsla(265,70%,50%,0.95), hsla(280,80%,60%,0.95))',
                border: '1px solid hsla(280,80%,70%,0.5)',
                boxShadow: '0 0 24px hsla(265,80%,55%,0.4)',
                color: '#fff',
              }}
            >
              <MapPin size={16} />
              Log a Find Here
              <ChevronRight size={14} className="ml-auto opacity-60" />
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}