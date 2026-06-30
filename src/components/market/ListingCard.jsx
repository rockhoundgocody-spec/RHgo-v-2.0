import React from 'react';
import { motion } from 'framer-motion';
import { Gem, MapPin, Shield, DollarSign, ArrowRightLeft, Eye } from 'lucide-react';

const RARITY_CFG = {
  common:    { color: '#94a3b8', glow: 'hsla(215,20%,55%,0.3)',  label: 'Common' },
  uncommon:  { color: '#34d399', glow: 'hsla(160,70%,50%,0.35)', label: 'Uncommon' },
  rare:      { color: '#38bdf8', glow: 'hsla(200,90%,60%,0.4)',  label: 'Rare' },
  legendary: { color: '#a78bfa', glow: 'hsla(270,80%,65%,0.5)',  label: 'Legendary' },
};

export default function ListingCard({ listing, index = 0, onTap }) {
  const rc = RARITY_CFG[listing.rarity] || RARITY_CFG.common;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onTap}
      className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      style={{
        background: 'linear-gradient(160deg, hsla(255,30%,12%,0.85), hsla(245,25%,7%,0.9))',
        border: `1px solid ${rc.glow.replace(/[\d.]+\)$/, '0.22)')}`,
        boxShadow: `0 4px 20px -8px ${rc.glow}`,
      }}
    >
      {/* Image */}
      <div className="aspect-square relative overflow-hidden flex items-center justify-center"
        style={{ background: `radial-gradient(circle at 40% 35%, ${rc.glow}, hsla(245,25%,6%,0.8))` }}>
        {listing.image_url
          ? <img src={listing.image_url} alt={listing.mineral_name} className="w-full h-full object-cover" />
          : <Gem size={32} style={{ color: rc.color, opacity: 0.5 }} />}
        <div className="absolute top-2 left-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
            style={{ background: `${rc.glow.replace(/[\d.]+\)$/, '0.25)')}`, color: rc.color, border: `1px solid ${rc.glow.replace(/[\d.]+\)$/, '0.35)')}` }}>
            {rc.label}
          </span>
        </div>
        {listing.verified && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: 'hsla(220,40%,5%,0.85)', border: '1px solid hsla(0,0%,100%,0.1)' }}>
            <Shield size={10} className="text-emerald-400" />
          </div>
        )}
        {listing.status === 'sold' && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'hsla(0,0%,0%,0.6)' }}>
            <span className="text-white font-black text-sm uppercase tracking-widest">SOLD</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="text-white/90 text-[13px] font-bold truncate mb-0.5">
          {listing.title || listing.mineral_name}
        </div>
        {listing.location_label && (
          <div className="flex items-center gap-1 text-white/35 text-[10px] mb-1.5 truncate">
            <MapPin size={9} /> {listing.location_label}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {listing.trade_only
              ? <><ArrowRightLeft size={10} style={{ color: rc.color }} /><span className="text-[10px] font-bold" style={{ color: rc.color }}>Trade</span></>
              : listing.asking_price > 0
                ? <><DollarSign size={10} style={{ color: rc.color }} /><span className="text-[11px] font-black" style={{ color: rc.color }}>{listing.asking_price.toFixed(0)}</span></>
                : <span className="text-[10px] font-bold text-white/40">Offer</span>}
          </div>
          {listing.view_count > 0 && (
            <div className="flex items-center gap-0.5 text-white/25 text-[9px]">
              <Eye size={8} /> {listing.view_count}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}