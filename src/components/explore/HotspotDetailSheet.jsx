/**
 * HotspotDetailSheet — bottom-sheet detail panel for a tapped hotspot.
 * Shows rock type, difficulty, recent finds, badge rewards, and a Log Find CTA.
 */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { X, MapPin, Shield, Star, Gem, ChevronRight, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBadgeAwarder } from '@/lib/useBadgeAwarder';

const DIFFICULTY_COLORS = {
  easy:     { text: 'text-emerald-400', border: 'border-emerald-400/30', bg: 'bg-emerald-400/10' },
  moderate: { text: 'text-amber-400',   border: 'border-amber-400/30',   bg: 'bg-amber-400/10'   },
  hard:     { text: 'text-orange-400',  border: 'border-orange-400/30',  bg: 'bg-orange-400/10'  },
  expert:   { text: 'text-rose-400',    border: 'border-rose-400/30',    bg: 'bg-rose-400/10'    },
};

const LAND_COLORS = {
  public:         'text-emerald-300',
  blm:            'text-amber-300',
  forest_service: 'text-lime-300',
  state_park:     'text-sky-300',
  private:        'text-rose-300',
  unknown:        'text-white/40',
};

const RARITY_COLORS = {
  common:    '#94a3b8',
  uncommon:  '#34d399',
  rare:      '#38bdf8',
  legendary: '#a78bfa',
};

export default function HotspotDetailSheet({ hotspot, recentFinds = [], onClose }) {
  // All hooks called unconditionally at top level
  const { earnedCodes, allBadges } = useBadgeAwarder();

  const badgeRewards = useMemo(() => {
    if (!hotspot) return [];
    return allBadges.filter((b) => {
      const minerals = hotspot.minerals || [];
      // Surface badges related to minerals found at this hotspot
      return minerals.some((m) =>
        b.title?.toLowerCase().includes(m.toLowerCase()) ||
        b.description?.toLowerCase().includes(m.toLowerCase())
      );
    }).slice(0, 3);
  }, [hotspot, allBadges]);

  const diffCls = DIFFICULTY_COLORS[hotspot?.difficulty] || DIFFICULTY_COLORS.moderate;
  const landCls = LAND_COLORS[hotspot?.land_type] || LAND_COLORS.unknown;
  const trustPct = Math.round((hotspot?.trust_score || 0) * 100);

  if (!hotspot) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="detail"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="rounded-t-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, hsla(245,30%,9%,0.97) 0%, hsla(240,25%,6%,0.99) 100%)',
          backdropFilter: 'blur(32px)',
          border: '1px solid hsla(270,30%,40%,0.2)',
          borderBottom: 'none',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-4 pb-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-base truncate pr-2">{hotspot.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[10px] font-mono uppercase tracking-wider ${landCls}`}>
                {(hotspot.land_type || 'unknown').replace(/_/g, ' ')}
              </span>
              {hotspot.state && <span className="text-white/30 text-[10px]">· {hotspot.state}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hotspot.difficulty && (
              <span className={`text-[9px] font-bold uppercase tracking-wider border rounded-lg px-2 py-1 ${diffCls.text} ${diffCls.border} ${diffCls.bg}`}>
                {hotspot.difficulty}
              </span>
            )}
            <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white/70"
              style={{ background: 'hsla(255,30%,20%,0.5)', border: '1px solid hsla(255,30%,40%,0.2)' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Trust score + description */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{
                background: `hsl(${trustPct}, 80%, 55%)`,
                boxShadow: `0 0 6px hsl(${trustPct}, 80%, 55%)`,
              }} />
              <span className="text-[10px] font-mono text-white/45">{trustPct}% trust</span>
            </div>
            {hotspot.source && (
              <span className="text-[9px] text-white/25 uppercase tracking-wider">· {hotspot.source}</span>
            )}
          </div>
          {hotspot.description && (
            <p className="text-white/50 text-xs leading-relaxed line-clamp-2">{hotspot.description}</p>
          )}
        </div>

        {/* Minerals list */}
        {hotspot.minerals?.length > 0 && (
          <div className="px-4 pb-3">
            <div className="text-[9px] uppercase tracking-[0.25em] text-white/25 mb-2 flex items-center gap-1.5">
              <Gem size={9} /> Minerals Found Here
            </div>
            <div className="flex flex-wrap gap-1.5">
              {hotspot.minerals.map((m) => (
                <span key={m} className="text-[10px] px-2.5 py-1 rounded-full border"
                  style={{ background: 'hsla(265,40%,15%,0.5)', borderColor: 'hsla(280,60%,55%,0.25)', color: 'hsl(280,80%,80%)' }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent finds */}
        {recentFinds.length > 0 && (
          <div className="px-4 pb-3">
            <div className="text-[9px] uppercase tracking-[0.25em] text-white/25 mb-2 flex items-center gap-1.5">
              <Star size={9} /> Recent Finds
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {recentFinds.slice(0, 6).map((s) => {
                const rc = RARITY_COLORS[s.rarity] || RARITY_COLORS.common;
                return (
                  <div key={s.id} className="flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl"
                    style={{ background: 'hsla(220,30%,10%,0.6)', border: `1px solid ${rc}30`, minWidth: 64 }}>
                    {s.image_url ? (
                      <img src={s.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: 'hsla(265,40%,15%,0.7)' }}>
                        <Gem size={14} style={{ color: rc }} />
                      </div>
                    )}
                    <span className="text-[9px] text-white/60 text-center truncate w-full">{s.mineral_name}</span>
                    <span className="text-[8px] font-bold capitalize" style={{ color: rc }}>{s.rarity}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Badge rewards */}
        {badgeRewards.length > 0 && (
          <div className="px-4 pb-3">
            <div className="text-[9px] uppercase tracking-[0.25em] text-white/25 mb-2 flex items-center gap-1.5">
              <Award size={9} /> Badge Opportunities
            </div>
            <div className="flex gap-2">
              {badgeRewards.map((b) => {
                const earned = earnedCodes.has(b.code);
                return (
                  <div key={b.code} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border"
                    style={{
                      background: earned ? 'hsla(145,50%,15%,0.4)' : 'hsla(265,40%,12%,0.5)',
                      borderColor: earned ? 'hsla(145,80%,50%,0.3)' : 'hsla(280,60%,45%,0.25)',
                    }}>
                    <span className="text-sm">{earned ? '✅' : '🏅'}</span>
                    <span className="text-[9px] font-semibold" style={{ color: earned ? '#34d399' : '#c084fc' }}>
                      {b.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rules */}
        {hotspot.rules && (
          <div className="mx-4 mb-3 px-3 py-2 rounded-xl text-[11px] text-amber-300/80"
            style={{ background: 'hsla(45,80%,30%,0.15)', border: '1px solid hsla(45,80%,50%,0.2)' }}>
            📋 {hotspot.rules}
          </div>
        )}

        {/* CTA */}
        <div className="px-4 pb-6" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
          <Link
            to="/scan"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold tracking-wide transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, hsla(265,70%,50%,0.9), hsla(280,80%,60%,0.9))',
              border: '1px solid hsla(280,80%,70%,0.5)',
              boxShadow: '0 0 20px hsla(265,80%,55%,0.3)',
              color: '#fff',
            }}
          >
            <MapPin size={15} />
            Log a Find Here
            <ChevronRight size={14} className="ml-auto opacity-60" />
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}