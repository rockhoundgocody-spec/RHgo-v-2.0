import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, Check } from 'lucide-react';
import BadgeMaterialPanel from './BadgeMaterialPanel.jsx';

function ShareRow({ badge }) {
  const [copied, setCopied] = useState(false);
  const text = `🏆 I just unlocked the "${badge.title}" badge on RockHound-GO! (${badge.rarity})`;
  const share = () => {
    if (navigator.share) { navigator.share({ title: 'RockHound-GO Badge', text }); }
    else { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="flex gap-2">
      <button onClick={share}
        className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold transition active:scale-95"
        style={{ background: 'hsla(195,80%,14%,0.7)', border: '1px solid hsla(195,80%,55%,0.35)', color: 'hsl(195,100%,82%)' }}>
        <Share2 size={12} /> Share
      </button>
      <button onClick={copy}
        className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold transition active:scale-95"
        style={{ background: 'hsla(265,60%,14%,0.7)', border: '1px solid hsla(280,60%,55%,0.35)', color: 'hsl(280,100%,88%)' }}>
        {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
      </button>
    </div>
  );
}

export default function BadgeUnlockFooter({ badge, scheme, onClose }) {
  const [showMaterials, setShowMaterials] = useState(false);

  return (
    <motion.div
      className="flex flex-col items-center gap-3 mt-5 w-full px-8"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65 }}
    >
      <ShareRow badge={badge} />

      <button onClick={() => setShowMaterials(v => !v)}
        className="text-[10px] uppercase tracking-wider text-white/28 hover:text-white/60 transition">
        {showMaterials ? '▲ Hide' : '▼ View'} Material Breakdown
      </button>

      <AnimatePresence>
        {showMaterials && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-sm overflow-hidden"
          >
            <BadgeMaterialPanel badge={badge} />
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={onClose}
        className="mt-1 px-12 py-3.5 rounded-full text-sm font-black tracking-widest transition active:scale-95"
        style={{
          background: `linear-gradient(135deg, ${scheme.primary}, ${scheme.secondary})`,
          color: 'hsl(255,60%,10%)',
          boxShadow: `0 0 28px ${scheme.glow.replace('0.9','0.55')}, 0 4px 16px hsla(255,60%,5%,0.4)`,
        }}>
        CONTINUE →
      </button>
    </motion.div>
  );
}
