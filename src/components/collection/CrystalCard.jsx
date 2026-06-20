import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar } from 'lucide-react';

const RARITY = {
  common:    { color: '#94a3b8', glow: 'hsla(215,20%,55%,0.4)',  label: 'Common',    heat: 'hsla(215,20%,55%,0.08)' },
  uncommon:  { color: '#34d399', glow: 'hsla(160,70%,50%,0.45)', label: 'Uncommon',  heat: 'hsla(160,60%,30%,0.12)' },
  rare:      { color: '#38bdf8', glow: 'hsla(200,90%,60%,0.5)',  label: 'Rare',      heat: 'hsla(200,80%,30%,0.15)' },
  legendary: { color: '#a78bfa', glow: 'hsla(270,80%,65%,0.6)',  label: 'Legendary', heat: 'hsla(270,60%,25%,0.22)' },
};

export default function CrystalCard({ specimen, index = 0 }) {
  const rc = RARITY[specimen?.rarity] || RARITY.common;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.97 }}
    >
      <Link to={`/specimen/${specimen.id}`} className="block rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${rc.heat}, hsla(245,30%,10%,0.7))`,
          border: `1px solid ${rc.glow.replace('0.4', '0.22').replace('0.45', '0.22').replace('0.5', '0.22').replace('0.6', '0.25')}`,
          boxShadow: `0 4px 24px -8px ${rc.glow}, inset 0 1px 0 hsla(270,60%,90%,0.07)`,
        }}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden">
          {specimen.image_url ? (
            <img
              src={specimen.image_url}
              alt={specimen.mineral_name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl"
              style={{ background: `radial-gradient(circle at 40% 35%, ${rc.glow}, transparent 70%)` }}>
              💎
            </div>
          )}
          {/* Rarity heat wash */}
          <div className="absolute inset-0 pointer-events-none mix-blend-screen"
            style={{ background: `radial-gradient(circle at 50% 60%, ${rc.glow.replace(/[\d.]+\)$/, '0.2)')}, transparent 70%)` }} />
          {/* Rarity badge */}
          <div className="absolute top-2 left-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
              style={{ background: `${rc.glow.replace(/[\d.]+\)$/, '0.25)')}`, color: rc.color, border: `1px solid ${rc.glow.replace(/[\d.]+\)$/, '0.35)')}` }}>
              {rc.label}
            </span>
          </div>
          {/* Confidence */}
          {specimen.ai_confidence != null && (
            <div className="absolute top-2 right-2">
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'hsla(220,40%,5%,0.8)', color: rc.color, backdropFilter: 'blur(6px)' }}>
                {(specimen.ai_confidence * 100).toFixed(0)}%
              </span>
            </div>
          )}
          {/* Crystal shine overlay */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, hsla(0,0%,100%,0.06) 0%, transparent 50%, hsla(0,0%,0%,0.1) 100%)' }} />
        </div>

        {/* Info */}
        <div className="px-3 py-2.5">
          <div className="text-white/90 text-[13px] font-bold truncate leading-tight mb-1"
            style={{ textShadow: `0 0 12px ${rc.glow}` }}>
            {specimen.mineral_name || 'Unknown'}
          </div>
          {specimen.found_at && (
            <div className="flex items-center gap-1 text-white/35 text-[10px]">
              <MapPin size={9} />
              <span className="truncate">{specimen.found_at}</span>
            </div>
          )}
          {specimen.found_date && (
            <div className="flex items-center gap-1 text-white/25 text-[10px] mt-0.5">
              <Calendar size={9} />
              {specimen.found_date}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}