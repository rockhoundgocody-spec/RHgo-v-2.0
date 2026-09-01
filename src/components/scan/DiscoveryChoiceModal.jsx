/**
 * DiscoveryChoiceModal — shown after a scan result is saved.
 * Chattel vs affixed choice: Add to My GeoDex (collect) or Mark In Place (legacy pin).
 * Includes legal-access confirmation and geo-privacy controls.
 */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gem, MapPin, ShieldCheck } from 'lucide-react';
import useReducedMotion from '@/lib/useReducedMotion';

const PRIVACY_OPTIONS = [
  { id: 'exact', label: 'Exact' },
  { id: 'approximate', label: 'Approximate' },
  { id: 'private', label: 'Private' },
];

export default function DiscoveryChoiceModal({ open, mineralName, onClose, onConfirm }) {
  const [disposition, setDisposition] = useState('collected');
  const [geoPrivacy, setGeoPrivacy] = useState('approximate');
  const [confirmedLegal, setConfirmedLegal] = useState(true);
  const reduceMotion = useReducedMotion();

  const canConfirm = Boolean(disposition && confirmedLegal);

  useEffect(() => {
    if (!open) return;
    setDisposition('collected');
    setGeoPrivacy('approximate');
    setConfirmedLegal(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  const xpLabel = disposition === 'left_in_place' ? '+40 Steward XP' : '+25 Collector XP';

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[6000] flex items-end sm:items-center justify-center px-4 pt-4 pb-safe"
          style={{
            paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
            background: 'hsla(245,30%,4%,0.8)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={reduceMotion ? false : { y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl p-5 overflow-y-auto"
            style={{
              maxHeight: 'calc(100dvh - 80px)',
              background: 'linear-gradient(180deg, hsl(250 20% 12%) 0%, hsl(248 22% 7%) 100%)',
              border: '1px solid hsla(270,50%,60%,0.25)',
              boxShadow: '0 12px 60px hsla(250,60%,3%,0.8), inset 0 1px 0 hsla(270,60%,90%,0.08)',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="discovery-choice-title"
            aria-describedby="discovery-choice-description"
          >
            <h2 id="discovery-choice-title" className="text-white font-black text-lg text-center tracking-tight">
              Save to Digital Collection
            </h2>
            <p id="discovery-choice-description" className="text-white/50 text-xs text-center mt-1 mb-4">
              Catalog <span className="text-amethyst-glow font-semibold">{mineralName || 'this specimen'}</span> into your personal GeoDex.
            </p>

            <div role="radiogroup" aria-label="Discovery disposition" className="grid grid-cols-2 gap-2.5">
              <ChoiceCard
                icon={Gem}
                title="Add to GeoDex"
                subtitle="Collected — joins your digital collection"
                xp="+25 Collector XP"
                accent="amethyst"
                selected={disposition === 'collected'}
                onClick={() => setDisposition('collected')}
              />
              <ChoiceCard
                icon={MapPin}
                title="Mark In Place"
                subtitle="Left in field — drop a landmark pin"
                xp="+40 Steward XP"
                accent="cyan"
                selected={disposition === 'left_in_place'}
                onClick={() => setDisposition('left_in_place')}
              />
            </div>

            {/* Geo privacy */}
            <div className="mt-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1.5 flex items-center justify-between">
                <span>Location privacy</span>
                <span className="text-[9px] text-white/30 font-normal">
                  {geoPrivacy === 'private' ? 'Only you can see' : geoPrivacy === 'approximate' ? 'Stealth Mode (City level)' : 'Precise GPS Pin'}
                </span>
              </div>
              <div role="radiogroup" aria-label="Location privacy" className="flex gap-1.5">
                {PRIVACY_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={geoPrivacy === p.id}
                    onClick={() => setGeoPrivacy(p.id)}
                    className="flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan"
                    style={{
                      color: geoPrivacy === p.id ? 'hsl(195,100%,85%)' : 'hsla(220,25%,65%,0.5)',
                      background: geoPrivacy === p.id ? 'hsla(195,100%,60%,0.15)' : 'hsla(0,0%,100%,0.03)',
                      border: `1px solid ${geoPrivacy === p.id ? 'hsla(195,90%,60%,0.45)' : 'hsla(0,0%,100%,0.08)'}`,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Legal / ethics confirmation */}
            <label className="mt-4 flex items-start gap-2.5 cursor-pointer select-none rounded-xl p-2.5 bg-white/[0.02] border border-white/5">
              <input
                type="checkbox"
                checked={confirmedLegal}
                onChange={(e) => setConfirmedLegal(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow"
              />
              <span className="text-white/60 text-[11px] leading-snug">
                <ShieldCheck size={13} className="inline mr-1 text-emerald-400" />
                I followed ethical rockhounding rules and had permission to collect or access this spot.
              </span>
            </label>

            <button
              type="button"
              disabled={!canConfirm}
              onClick={() => onConfirm({ disposition, geoPrivacy })}
              className="mt-4 w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all disabled:opacity-35 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow flex items-center justify-center gap-2"
              style={{
                background: canConfirm
                  ? disposition === 'left_in_place'
                    ? 'linear-gradient(135deg, hsl(160 70% 45%), hsl(180 75% 35%))'
                    : 'linear-gradient(135deg, hsl(280 75% 55%), hsl(265 80% 45%))'
                  : 'hsla(0,0%,100%,0.06)',
                color: 'white',
                boxShadow: canConfirm
                  ? disposition === 'left_in_place'
                    ? '0 4px 24px hsla(160,80%,40%,0.35)'
                    : '0 4px 24px hsla(280,80%,50%,0.4)'
                  : 'none',
              }}
            >
              <Gem size={16} />
              {disposition === 'left_in_place' ? `Log Field Pin (${xpLabel})` : `Save to GeoDex (${xpLabel})`}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function ChoiceCard({ icon: Icon, title, subtitle, xp, accent, selected, onClick }) {
  const c = accent === 'cyan'
    ? { icon: 'hsl(195,100%,75%)', border: 'hsla(195,90%,60%,0.55)', glow: 'hsla(195,100%,60%,0.25)' }
    : { icon: 'hsl(280,85%,80%)', border: 'hsla(280,80%,65%,0.55)', glow: 'hsla(280,100%,65%,0.25)' };
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className="flex flex-col items-center text-center gap-1.5 rounded-2xl px-3 py-4 transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow"
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