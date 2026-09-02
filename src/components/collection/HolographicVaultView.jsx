import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Gem, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerOrbHaptic } from '@/lib/orbAudio';

export default function HolographicVaultView({ specimens = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!specimens.length) return null;

  const current = specimens[currentIndex] || specimens[0];

  const handlePrev = () => {
    triggerOrbHaptic('tap');
    setCurrentIndex((i) => (i - 1 + specimens.length) % specimens.length);
  };

  const handleNext = () => {
    triggerOrbHaptic('tap');
    setCurrentIndex((i) => (i + 1) % specimens.length);
  };

  return (
    <div className="relative flex flex-col items-center py-4">
      {/* 3D Showcase Spotlight Background */}
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(circle at 50% 30%, hsla(270,70%,40%,0.2) 0%, transparent 70%)',
        }}
      />

      {/* Vault Carousel Navigator */}
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <button
          onClick={handlePrev}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white/70 hover:text-white transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow"
          aria-label="Previous specimen"
        >
          <ChevronLeft size={20} />
        </button>

        <span className="text-xs font-mono font-bold tracking-widest text-amethyst-glow uppercase">
          Vault {currentIndex + 1} of {specimens.length}
        </span>

        <button
          onClick={handleNext}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white/70 hover:text-white transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow"
          aria-label="Next specimen"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 3D Floating Holographic Pedestal Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id || currentIndex}
          initial={{ opacity: 0, scale: 0.88, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: -15 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-sm rounded-3xl p-5 overflow-hidden relative shadow-2xl"
          style={{
            background: 'linear-gradient(160deg, hsla(250,30%,14%,0.9), hsla(240,25%,7%,0.95))',
            border: '1px solid hsla(270,50%,60%,0.35)',
            boxShadow: '0 20px 50px -10px hsla(270,80%,30%,0.3)',
          }}
        >
          {/* Specimen image on pedestal */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-4 border border-white/10 shadow-inner">
            {current.image_url ? (
              <img
                src={current.image_url}
                alt={current.name || 'Specimen'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-black/40 flex items-center justify-center">
                <Gem size={48} className="text-amethyst-glow/50" />
              </div>
            )}
            {/* Holographic scanner line */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, hsla(190,100%,70%,0.4) 0 1px, transparent 1px 3px)',
              }}
            />

            {/* Rarity chip */}
            <div className="absolute top-3 left-3">
              <span className="text-[9px] uppercase font-mono font-black px-2.5 py-1 rounded-full bg-black/70 border border-white/20 text-white backdrop-blur-md">
                {current.rarity || 'Common'}
              </span>
            </div>
          </div>

          {/* Pedestal Base Glow Ring */}
          <div
            className="w-3/4 h-3 rounded-full mx-auto -mt-6 mb-4 blur-sm"
            style={{ background: 'radial-gradient(circle, hsla(280,100%,70%,0.6) 0%, transparent 80%)' }}
          />

          {/* Details */}
          <div className="text-center space-y-1">
            <h3 className="text-lg font-black text-white leading-tight">
              {current.name || 'Unknown Mineral'}
            </h3>
            {current.scientific_name && (
              <p className="text-[11px] font-mono text-amethyst-glow">{current.scientific_name}</p>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-1.5 p-2.5 rounded-2xl bg-black/30 border border-white/5 text-center">
            <div>
              <span className="text-[8px] uppercase tracking-wider text-white/40 block">Hardness</span>
              <span className="text-xs font-black text-white">{current.hardness_mohs ? `${current.hardness_mohs}M` : '7.0M'}</span>
            </div>
            <div>
              <span className="text-[8px] uppercase tracking-wider text-white/40 block">System</span>
              <span className="text-xs font-black text-white truncate block">{current.crystal_system || 'Trigonal'}</span>
            </div>
            <div>
              <span className="text-[8px] uppercase tracking-wider text-white/40 block">Appraisal</span>
              <span className="text-xs font-black text-emerald-400">{current.value_estimate || '$15–$35'}</span>
            </div>
          </div>

          <div className="mt-4">
            <Link to={`/specimen/${current.id}`}>
              <Button className="w-full h-11 text-xs font-extrabold rounded-xl text-white bg-gradient-to-r from-amethyst to-purple-800 hover:from-amethyst-glow transition flex items-center justify-center gap-1.5">
                Inspect Specimen Dossier <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
