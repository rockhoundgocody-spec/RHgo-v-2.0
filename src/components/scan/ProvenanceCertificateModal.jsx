import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, ShieldCheck, X, Share2, Gem, Check, Sparkles, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProvenanceCertificateModal({ open, result, savedId, gpsCoords, onClose }) {
  const [copied, setCopied] = React.useState(false);

  if (!open || !result) return null;

  const certId = `RHGO-${(savedId || 'SPEC').slice(-6).toUpperCase()}-${new Date().getFullYear()}`;
  const mineral = result.top_match || 'Specimen';
  const rarity = (result.rarity || 'Common').toUpperCase();
  const value = result.value_estimate || '$15 – $40';
  const hardness = result.hardness_mohs ? `${result.hardness_mohs} Mohs` : '6.5 – 7.0 Mohs';
  const formula = result.chemical_formula || 'SiO₂';

  const handleShare = () => {
    const text = `RockHound-GO Digital Provenance Certificate ${certId}\nMineral: ${mineral}\nFormula: ${formula}\nHardness: ${hardness}\nAppraised Value: ${value}\nCataloged on rhgo.me`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[7000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-3xl p-6 overflow-hidden shadow-2xl text-white"
          style={{
            background: 'linear-gradient(160deg, hsl(250 35% 12%) 0%, hsl(240 30% 6%) 100%)',
            border: '2px solid hsla(45,90%,60%,0.4)',
            boxShadow: '0 0 50px hsla(45,90%,50%,0.25)',
          }}
        >
          {/* Close button */}
          <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white p-1">
            <X size={18} />
          </button>

          {/* Certificate Header */}
          <div className="text-center space-y-1 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] uppercase font-black tracking-widest">
              <Award size={12} /> Official Mineral Provenance
            </div>
            <h2 className="text-lg font-black tracking-tight mt-1 text-white">RockHound-GO Codex</h2>
            <div className="text-[10px] font-mono text-white/50 tracking-wider">CERTIFICATE NO: {certId}</div>
          </div>

          {/* Certificate Body */}
          <div
            className="rounded-2xl p-4 space-y-3 relative overflow-hidden"
            style={{
              background: 'hsla(240,25%,9%,0.8)',
              border: '1px solid hsla(45,80%,60%,0.2)',
            }}
          >
            <div className="border-b border-white/10 pb-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-black text-white">{mineral}</div>
                <div className="text-[10px] font-mono text-amethyst-glow font-bold">{formula}</div>
              </div>
              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                {rarity}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-white/40 block">Mohs Hardness</span>
                <span className="font-bold text-white/90">{hardness}</span>
              </div>
              <div>
                <span className="text-white/40 block">Crystal System</span>
                <span className="font-bold text-white/90">{result.crystal_system || 'Trigonal'}</span>
              </div>
              <div>
                <span className="text-white/40 block">Appraisal Range</span>
                <span className="font-bold text-emerald-400">{value}</span>
              </div>
              <div>
                <span className="text-white/40 block">Verification</span>
                <span className="font-bold text-cyan-400 flex items-center gap-1">
                  <ShieldCheck size={11} /> AI Validated
                </span>
              </div>
            </div>

            {gpsCoords && (
              <div className="pt-2 border-t border-white/10 flex items-center gap-1.5 text-[9px] text-white/50 font-mono">
                <MapPin size={10} className="text-amber-400" />
                Provenance Coordinates: {gpsCoords.lat?.toFixed(3)}°N, {gpsCoords.lng?.toFixed(3)}°W
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleShare}
              className="flex-1 h-11 text-xs font-extrabold rounded-xl text-white shadow-lg active:scale-98 transition-all flex items-center justify-center gap-1.5"
              style={{
                background: 'linear-gradient(135deg, hsl(45 90% 48%), hsl(28 85% 42%))',
              }}
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              {copied ? 'Certificate Copied!' : 'Copy & Share Certificate'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
