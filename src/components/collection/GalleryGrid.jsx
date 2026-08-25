import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gem, MapPin, Calendar, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const RARITY_GLOW = {
  common:    { color: '#94a3b8', glow: 'hsla(215,20%,60%,0.5)' },
  uncommon:  { color: '#34d399', glow: 'hsla(158,64%,52%,0.6)' },
  rare:      { color: '#c084fc', glow: 'hsla(270,70%,65%,0.7)' },
  legendary: { color: '#fbbf24', glow: 'hsla(43,96%,56%,0.8)' },
};

export function SpecimenGridTile({ specimen, index, onSelect }) {
  const r = RARITY_GLOW[specimen.rarity] || RARITY_GLOW.common;
  return (
    <motion.button
      key={specimen.id}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.025, type: 'spring', stiffness: 320, damping: 22 }}
      whileTap={{ scale: 0.93 }}
      onClick={() => onSelect(specimen)}
      aria-label={`View specimen: ${specimen.mineral_name}`}
      className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow"
      style={{
        border: `1px solid ${r.color}30`,
        boxShadow: `0 2px 12px ${r.glow.replace('0.', '0.08')}`,
      }}
    >
      {specimen.image_url ? (
        <img
          src={specimen.image_url}
          alt={specimen.mineral_name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center"
          style={{ background: `radial-gradient(circle at 40% 40%, ${r.color}18, hsla(245,30%,10%,.9))` }}>
          <Gem size={22} style={{ color: r.color, opacity: 0.6 }} />
        </div>
      )}

      {/* Rarity shimmer overlay on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${r.glow.replace(/[\d.]+\)$/, '0.22)')}, transparent 70%)`,
        }}
      />

      {/* Tap glow ring (amethyst for rare+) */}
      {(specimen.rarity === 'rare' || specimen.rarity === 'legendary') && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: `inset 0 0 0 1px ${r.color}60`,
            animation: 'gallery-rare-pulse 3s ease-in-out infinite',
          }}
        />
      )}

      {/* Bottom label */}
      <div className="absolute bottom-0 inset-x-0 p-1.5 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, hsla(240,30%,5%,.85) 0%, transparent 100%)',
        }}>
        <p className="text-[9px] font-semibold text-white/90 truncate leading-tight">{specimen.mineral_name}</p>
      </div>
    </motion.button>
  );
}

export function SpecimenLightboxModal({ specimen, onClose }) {
  if (!specimen) return null;
  const r = RARITY_GLOW[specimen.rarity] || RARITY_GLOW.common;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'hsla(240,25%,4%,.92)', backdropFilter: 'blur(20px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.88, y: 24 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          border: `1px solid ${r.color}50`,
          boxShadow: `0 0 80px -10px ${r.glow}, 0 32px 64px hsla(240,30%,4%,.8)`,
        }}
      >
        {/* Image */}
        <div className="relative aspect-square bg-black">
          {specimen.image_url ? (
            <img src={specimen.image_url} alt={specimen.mineral_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: `radial-gradient(circle, ${r.color}12, hsla(245,30%,6%,1))` }}>
              <Gem size={56} style={{ color: r.color, opacity: 0.4 }} />
            </div>
          )}
          {/* Amethyst glow tap effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 80%, ${r.glow.replace(/[\d.]+\)$/, '0.3)')}, transparent 60%)`,
            }}
          />
        </div>

        {/* Info card */}
        <div className="p-4" style={{ background: 'linear-gradient(180deg,hsla(245,30%,10%,.99),hsla(240,25%,7%,1))' }}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-white font-bold text-lg leading-tight">{specimen.mineral_name}</h3>
              {specimen.common_name && <p className="text-white/40 text-xs">{specimen.common_name}</p>}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
              style={{
                color: r.color,
                background: `${r.color}18`,
                border: `1px solid ${r.color}35`,
              }}>
              {specimen.rarity || 'common'}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 text-[10px] text-white/40 mb-4">
            {specimen.found_at && (
              <span className="flex items-center gap-1"><MapPin size={10} />{specimen.found_at}</span>
            )}
            {specimen.found_date && (
              <span className="flex items-center gap-1"><Calendar size={10} />{specimen.found_date}</span>
            )}
            {specimen.ai_confidence && (
              <span className="flex items-center gap-1"><Star size={10} />{Math.round(specimen.ai_confidence * 100)}% confidence</span>
            )}
          </div>

          {specimen.notes && (
            <p className="text-xs text-white/50 leading-relaxed mb-4 line-clamp-2">{specimen.notes}</p>
          )}

          <Link
            to={`/specimen/${specimen.id}`}
            className="block w-full text-center py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow"
            style={{
              background: `linear-gradient(135deg, ${r.color}22, ${r.color}10)`,
              border: `1px solid ${r.color}45`,
              color: r.color,
              boxShadow: `0 0 20px ${r.glow.replace(/[\d.]+\)$/, '0.2)')}`,
            }}
            onClick={onClose}
          >
            View Full Details
          </Link>
        </div>

        <button onClick={onClose}
          aria-label="Close details"
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow"
          style={{ background: 'hsla(240,30%,8%,.8)', border: '1px solid hsla(255,30%,40%,.25)' }}>
          <X size={15} className="text-white/70" />
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function GalleryGrid({ specimens }) {
  const [selected, setSelected] = useState(null);

  if (!specimens.length) return null;

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {specimens.map((s, i) => (
          <SpecimenGridTile key={s.id} specimen={s} index={i} onSelect={setSelected} />
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <SpecimenLightboxModal specimen={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes gallery-rare-pulse {
          0%,100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  );
}
