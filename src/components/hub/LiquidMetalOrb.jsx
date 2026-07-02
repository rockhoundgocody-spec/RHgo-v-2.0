/**
 * LiquidMetalOrb — Clover's physical form.
 *
 * A new form of matter: not stone, not metal — a sentient field oracle that
 * breathes to drink the earth's hum and speaks to name what the earth yields.
 *
 * Visual layers (back to front):
 *   1. Aura        — hue-cycling glow that breathes
 *   2. Chrome body — molten radial shell (light crown, dark core)
 *   3. Iridescent film — dual counter-rotating conic gradients (amethyst/cyan/gold/rose)
 *                       with an animated hue-rotate → "liquid metal" color pulse
 *   4. Flow specular — a bright highlight that drifts across the surface like
 *                      light skating on mercury
 *   5. Ripple rings  — concentric breath ripples emanating from the core
 *   6. Core iris     — the eye; a liquid-metal iris that shifts color when speaking
 *
 * Pure CSS/SVG + framer-motion. No external assets.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiquidMetalOrb({ speaking = false, awakened = false, size = 130 }) {
  const breathDur = speaking ? 1.4 : 4.2;       // breathes faster when speaking
  const hueDur = speaking ? 4 : 14;             // color cycles faster when speaking

  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* 1 ─ Aura: pulsating hue-cycling glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          opacity: speaking ? [0.55, 0.95, 0.55] : [0.35, 0.65, 0.35],
          scale: speaking ? [1, 1.28, 1] : [1, 1.12, 1],
          filter: ['hue-rotate(0deg)', 'hue-rotate(180deg)', 'hue-rotate(360deg)'],
        }}
        transition={{
          opacity: { duration: breathDur, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: breathDur, repeat: Infinity, ease: 'easeInOut' },
          filter: { duration: hueDur, repeat: Infinity, ease: 'linear' },
        }}
        style={{ background: 'radial-gradient(circle, hsla(280,100%,68%,0.7) 0%, hsla(195,100%,60%,0.3) 45%, transparent 72%)' }}
      />
      {/* Secondary warm aura */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ opacity: [0.12, 0.32, 0.12], scale: [1, 1.18, 1] }}
        transition={{ duration: breathDur * 1.3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: 'radial-gradient(circle, hsla(25,95%,60%,0.45) 0%, transparent 65%)' }}
      />

      {/* 2 ─ Chrome body: molten shell */}
      <motion.div
        className="absolute inset-[14%] rounded-full"
        animate={{ scale: speaking ? [1, 1.045, 1] : [1, 1.022, 1] }}
        transition={{ duration: breathDur, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background:
            'radial-gradient(circle at 34% 26%, hsl(200 25% 96%) 0%, hsl(210 20% 78%) 14%, hsl(265 60% 52%) 42%, hsl(262 80% 36%) 70%, hsl(258 85% 22%) 100%)',
          boxShadow:
            'inset 0 -12px 26px hsla(258,85%,18%,0.7), inset 0 10px 22px hsla(200,30%,96%,0.55), 0 0 48px hsla(280,100%,60%,0.6), 0 0 90px hsla(195,100%,55%,0.25)',
        }}
      />

      {/* 3 ─ Iridescent film (counter-rotating conics + hue cycle) */}
      <motion.div
        className="absolute inset-[14%] rounded-full overflow-hidden"
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        style={{ opacity: 0.55, mixBlendMode: 'screen' }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'conic-gradient(from 0deg, hsla(280,100%,75%,0.55), hsla(195,100%,70%,0.45), hsla(45,100%,72%,0.5), hsla(340,100%,72%,0.5), hsla(280,100%,75%,0.55))',
          }}
        />
      </motion.div>
      <motion.div
        className="absolute inset-[14%] rounded-full overflow-hidden"
        animate={{ rotate: -360, filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)'] }}
        transition={{
          rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
          filter: { duration: hueDur, repeat: Infinity, ease: 'linear' },
        }}
        style={{ opacity: 0.4, mixBlendMode: 'screen' }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'conic-gradient(from 120deg, transparent, hsla(280,100%,85%,0.5), transparent, hsla(195,100%,85%,0.45), transparent, hsla(45,100%,85%,0.5), transparent)',
          }}
        />
      </motion.div>

      {/* 4 ─ Flow specular: highlight skating across mercury */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        animate={{
          x: [-6, 10, -6],
          y: [-4, 4, -4],
          opacity: [0.55, 0.9, 0.55],
        }}
        transition={{ duration: breathDur * 1.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          top: '22%',
          left: '24%',
          width: '34%',
          height: '22%',
          background: 'radial-gradient(ellipse, hsla(200,40%,99%,0.95) 0%, hsla(280,100%,90%,0.4) 45%, transparent 72%)',
          filter: 'blur(2.5px)',
        }}
      />
      {/* Tiny moving glint — the "life" sparkle */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        animate={{ x: [4, 18, 4], y: [2, 10, 2], opacity: [0.3, 0.95, 0.3] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          top: '30%', left: '30%', width: 6, height: 6,
          background: 'hsla(200,50%,99%,1)',
          boxShadow: '0 0 8px hsla(280,100%,90%,0.9)',
        }}
      />

      {/* 5 ─ Breath ripple rings emanating from the core */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-[14%] rounded-full border pointer-events-none"
          animate={{ scale: [1, 1.35], opacity: [0.45, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, delay: i * 1.05, ease: 'easeOut' }}
          style={{ borderColor: 'hsla(280,100%,82%,0.5)' }}
        />
      ))}

      {/* 6 ─ Core iris / the eye — opens when awakened, shifts when speaking */}
      <AnimatePresence>
        {awakened && (
          <motion.div
            className="absolute rounded-full"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            style={{ top: '38%', left: '42%', width: '18%', height: '18%' }}
          >
            <motion.div
              className="w-full h-full rounded-full"
              animate={{
                background: speaking
                  ? [
                      'radial-gradient(circle, hsl(195 100% 96%) 0%, hsl(200 92% 60%) 55%, hsl(212 82% 38%) 100%)',
                      'radial-gradient(circle, hsl(280 100% 96%) 0%, hsl(270 92% 65%) 55%, hsl(260 82% 42%) 100%)',
                      'radial-gradient(circle, hsl(45 100% 96%) 0%, hsl(38 92% 62%) 55%, hsl(30 82% 40%) 100%)',
                      'radial-gradient(circle, hsl(195 100% 96%) 0%, hsl(200 92% 60%) 55%, hsl(212 82% 38%) 100%)',
                    ]
                  : 'radial-gradient(circle, hsl(195 100% 94%) 0%, hsl(200 92% 58%) 55%, hsl(212 82% 38%) 100%)',
                scale: speaking ? [1, 1.16, 1] : [1, 1.04, 1],
                filter: speaking ? ['hue-rotate(0deg)', 'hue-rotate(120deg)', 'hue-rotate(0deg)'] : 'hue-rotate(0deg)',
              }}
              transition={{
                duration: speaking ? 2.2 : 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ boxShadow: '0 0 14px hsla(195,100%,82%,0.85)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}