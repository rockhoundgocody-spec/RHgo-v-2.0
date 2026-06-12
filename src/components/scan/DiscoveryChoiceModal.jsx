/**
 * DiscoveryChoiceModal — shown after a scan result is saved.
 * Chattel vs affixed choice: Add to My GeoDex (collect) or Mark In Place (legacy pin).
 * Includes legal-access confirmation and geo-privacy controls.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gem, MapPin, ShieldCheck } from 'lucide-react';

const PRIVACY_OPTIONS = [
  { id: 'exact', label: 'Exact' },
  { id: 'approximate', label: 'Approximate' },
  { id: 'private', label: 'Private' },
];

export default function DiscoveryChoiceModal({ open, mineralName, onClose, onConfirm }) {
  const [disposition, setDisposition] = useState(null);
  const [geoPrivacy, setGeoPrivacy] = useState('approximate');
  const [confirmedLegal, setConfirmedLegal] = useState(false);

  const canConfirm = disposition && confirmedLegal;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'hsla(245,30%,4%,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl p-5"
            style={{
              background: 'linear-gradient(180deg, hsl(250 20% 12%) 0%, hsl(248 22% 7%) 100%)',
              border: '1px solid hsla(270,50%,60%,0.25)',
              boxShadow: '0 12px 60px hsla(250,60%,3%,0.8), inset 0 1px 0 hsla(270,60%,90%,0.08)',
            }}
          >
            <h2 className="text-white font-bold text-lg text-center">Discovery Choice</h2>
            <p className="text-white/40 text-[11px] text-center mt-1 mb-4">
              What happens to this {mineralName || 'specimen'}?
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <ChoiceCard
                icon={Gem}
                title="Add to My GeoDex"
                subtitle="Collect it — it joins your collection"
                xp="+25 Collector XP"
                accent="amethyst"
                selected={disposition === 'collected'}
                onClick={() => setDisposition('collected')}
              />
              <ChoiceCard
                icon={MapPin}
                title="Mark In Place"
                subtitle="Leave it for others — drop a legacy pin"
                xp="+40 Steward XP"
                accent="cyan"
                selected={disposition === 'left_in_place'}
                onClick={() => setDisposition('left_in_place')}
              />
            </div>

            {/* Geo privacy */}
            <div className="mt-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1.5">
                Location privacy
              </div>
              <div className="flex gap-1.5">
                {PRIVACY_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setGeoPrivacy(p.id)}
                    className="flex-1 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-colors"
                    style={{
                      color: geoPrivacy === p.id ? 'hsl(195,100%,80%)' : 'hsla(220,25%,65%,0.5)',
                      background: geoPrivacy === p.id ? 'hsla(195,100%,60%,0.1)' : 'hsla(0,0%,100%,0.03)',
                      border: `1px solid ${geoPrivacy === p.id ? 'hsla(195,90%,60%,0.4)' : 'hsla(0,0%,100%,0.08)'}`,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Legal / ethics confirmation */}
            <label className="mt-4 flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmedLegal}
                onChange={(e) => setConfirmedLegal(e.target.checked)}
                className="mt-0.5 accent-purple-400"
              />
              <span className="text-white/55 text-[11px] leading-snug">
                <ShieldCheck size={12} className="inline mr-1 text-emerald-400" />
                I had legal access to this location and followed local collecting rules.
                Never collect where prohibited — when in doubt, mark in place.
              </span>
            </label>

            <button
              disabled={!canConfirm}
              onClick={() => onConfirm({ disposition, geoPrivacy })}
              className="mt-4 w-full py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-35"
              style={{
                background: canConfirm
                  ? 'linear-gradient(135deg, hsl(280 70% 55%), hsl(265 75% 45%))'
                  : 'hsla(0,0%,100%,0.06)',
                color: 'white',
                boxShadow: canConfirm ? '0 4px 24px hsla(280,80%,50%,0.35)' : 'none',
              }}
            >
              Confirm Discovery
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ChoiceCard({ icon: Icon, title, subtitle, xp, accent, selected, onClick }) {
  const c = accent === 'cyan'
    ? { icon: 'hsl(195,100%,75%)', border: 'hsla(195,90%,60%,0.55)', glow: 'hsla(195,100%,60%,0.25)' }
    : { icon: 'hsl(280,85%,80%)', border: 'hsla(280,80%,65%,0.55)', glow: 'hsla(280,100%,65%,0.25)' };
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center text-center gap-1.5 rounded-2xl px-3 py-4 transition-all active:scale-[0.97]"
      style={{
        background: 'hsla(0,0%,100%,0.04)',
        border: `1.5px solid ${selected ? c.border : 'hsla(0,0%,100%,0.1)'}`,
        boxShadow: selected ? `0 0 20px ${c.glow}` : 'none',
      }}
    >
      <Icon size={22} strokeWidth={1.6} style={{ color: c.icon }} />
      <span className="text-white text-[12px] font-bold leading-tight">{title}</span>
      <span className="text-white/40 text-[10px] leading-snug">{subtitle}</span>
      <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: c.icon }}>
        {xp}
      </span>
    </button>
  );
}