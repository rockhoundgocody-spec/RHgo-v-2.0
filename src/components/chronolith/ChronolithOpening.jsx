import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Globe, Clock, AlertTriangle } from 'lucide-react';

/**
 * ChronolithOpening — the cinematic intro.
 *
 * Phase 1: Black screen → point of light expands inside the object
 * Phase 2: Opening text appears
 * Phase 3: Investigation summary animates in (age, environments, locations, hypotheses)
 * Phase 4: "Enter the Trial" button
 */
export default function ChronolithOpening({ caseData, imageUrl, onEnter, onSkip }) {
  const [phase, setPhase] = useState(0); // 0=black, 1=light, 2=text, 3=summary, 4=enter

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),   // point of light
      setTimeout(() => setPhase(2), 1600),  // text
      setTimeout(() => setPhase(3), 4200),  // summary
      setTimeout(() => setPhase(4), 7000),  // enter button
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const hypotheses = caseData?.hypotheses || [];
  const leadingH = hypotheses.find((h) => h.probability === Math.max(...hypotheses.map((x) => x.probability))) || hypotheses[0];

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: phase === 0 ? '#000' : 'radial-gradient(ellipse at center, hsl(250,30%,8%) 0%, #000 70%)' }}>

      {/* Skip button */}
      <button onClick={onSkip} className="absolute top-4 right-4 text-[10px] uppercase tracking-widest text-white/20 hover:text-white/50 transition z-10">
        Skip →
      </button>

      {/* Phase 0-1: Point of light */}
      <AnimatePresence>
        {phase >= 1 && phase < 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute"
          >
            {imageUrl ? (
              <div className="relative">
                <img src={imageUrl} alt="specimen" className="w-40 h-40 object-cover rounded-full opacity-40" />
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'radial-gradient(circle, hsla(280,100%,70%,0.6) 0%, transparent 60%)' }}
                  animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            ) : (
              <motion.div
                className="w-32 h-32 rounded-full"
                style={{ background: 'radial-gradient(circle, hsla(280,100%,70%,0.8) 0%, hsla(270,80%,50%,0.2) 40%, transparent 70%)' }}
                animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 2: Opening text */}
      <AnimatePresence>
        {phase >= 2 && phase < 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
            className="absolute text-center px-8 max-w-sm z-10"
          >
            <p className="text-white/80 text-sm leading-relaxed font-light">
              This object existed before you knew its name.
            </p>
            <p className="text-white/50 text-xs mt-3 leading-relaxed font-light">
              Let us reconstruct what happened.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 3-4: Investigation summary */}
      <AnimatePresence>
        {phase >= 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-6 overflow-y-auto"
            style={{ paddingTop: 'max(env(safe-area-inset-top,0px), 60px)', paddingBottom: '100px' }}
          >
            {/* Opening statement */}
            {caseData?.opening_statement && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center text-white/80 text-sm leading-relaxed max-w-xs mb-6 font-light"
              >
                {caseData.opening_statement}
              </motion.p>
            )}

            {/* Specimen image */}
            {imageUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="relative mb-6"
              >
                <img src={imageUrl} alt="specimen" className="w-28 h-28 object-cover rounded-2xl opacity-70"
                  style={{ border: '1px solid hsla(270,80%,60%,0.3)', boxShadow: '0 0 40px -8px hsla(280,80%,50%,0.3)' }} />
                <div className="absolute inset-0 rounded-2xl animate-hud-scan pointer-events-none"
                  style={{ background: 'linear-gradient(180deg, transparent, hsla(195,100%,60%,0.15), transparent)' }} />
              </motion.div>
            )}

            {/* Age range */}
            {caseData?.estimated_age_range && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
                style={{ background: 'hsla(220,40%,6%,0.6)', border: '1px solid hsla(270,30%,30%,0.2)' }}
              >
                <Clock size={12} className="text-cyan-400 shrink-0" />
                <div>
                  <div className="text-[8px] uppercase tracking-widest text-white/30">Estimated Age</div>
                  <div className="text-xs text-white/80">{caseData.estimated_age_range}</div>
                </div>
              </motion.div>
            )}

            {/* Candidate environments */}
            {caseData?.candidate_environments?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
                style={{ background: 'hsla(220,40%,6%,0.6)', border: '1px solid hsla(270,30%,30%,0.2)' }}
              >
                <Globe size={12} className="text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[8px] uppercase tracking-widest text-white/30">Candidate Environments</div>
                  <div className="text-xs text-white/80">{caseData.candidate_environments.slice(0, 3).join(' · ')}</div>
                </div>
              </motion.div>
            )}

            {/* Hypotheses branching */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="w-full max-w-xs space-y-1.5"
            >
              <div className="text-[8px] uppercase tracking-widest text-white/30 mb-2 text-center">
                {hypotheses.length} Competing Histories
              </div>
              {hypotheses.map((h, i) => (
                <motion.div
                  key={h.id || i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + i * 0.15 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{
                    background: h === leadingH ? 'hsla(270,50%,20%,0.3)' : 'hsla(220,40%,6%,0.5)',
                    border: `1px solid ${h === leadingH ? 'hsla(270,80%,60%,0.3)' : 'hsla(0,0%,100%,0.06)'}`,
                  }}
                >
                  <span className="text-[9px] font-mono font-bold w-6 shrink-0"
                    style={{ color: h === leadingH ? '#a78bfa' : 'rgba(255,255,255,0.3)' }}>
                    {Math.round((h.probability || 0) * 100)}%
                  </span>
                  <span className="text-xs text-white/70 truncate flex-1">{h.name}</span>
                  {h.contradictions?.length > 0 && (
                    <AlertTriangle size={10} className="text-red-400/60 shrink-0" />
                  )}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 4: Enter button */}
      <AnimatePresence>
        {phase >= 4 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onClick={onEnter}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition active:scale-95 z-20"
            style={{
              background: 'linear-gradient(135deg, hsl(265,70%,52%), hsl(280,90%,62%))',
              boxShadow: '0 4px 24px -4px hsla(270,80%,60%,0.55)',
            }}
          >
            <Sparkles size={15} /> Enter the Reality Trial <ArrowRight size={15} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}