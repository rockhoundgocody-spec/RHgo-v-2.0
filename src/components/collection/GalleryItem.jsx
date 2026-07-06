import React from 'react';
import { motion } from 'framer-motion';
import { Gem } from 'lucide-react';
import { RARITY_GLOW } from './gallery-constants.js';

export default function GalleryItem({ specimen, index, onClick }) {
  const r = RARITY_GLOW[specimen.rarity] || RARITY_GLOW.common;

  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.025, type: 'spring', stiffness: 320, damping: 22 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => onClick(specimen)}
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

      <style>{`
        @keyframes gallery-rare-pulse {
          0%,100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  );
}
