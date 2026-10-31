import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Cpu, ShieldCheck, ChevronRight } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    icon: Camera,
    title: 'Snap in the field',
    detail: 'Frame any specimen — daylight or headlamp, online or off-grid.',
    tag: 'OPTICAL CAPTURE',
    accent: '#9FE8D0',
  },
  {
    num: '02',
    icon: Cpu,
    title: 'Spatial Bayesian ID',
    detail: 'Fuses crystal habit, luster, and local bedrock geology in seconds.',
    tag: 'CONTEXT ENGINE',
    accent: '#FFE2AA',
  },
  {
    num: '03',
    icon: ShieldCheck,
    title: 'Verify & log to Geo-DEX',
    detail: 'Check BLM / public land rules and archive coordinates privately.',
    tag: 'FIELD ARCHIVE',
    accent: '#9FE8D0',
  },
];

export default function LandingHowItWorks() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, delay: 1.35, ease: [0.16, 1, 0.3, 1] }}
      aria-label="How RockHound GO works"
      className="w-full max-w-xs lg:max-w-md mt-8 mb-4"
    >
      {/* App-style HUD section header */}
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          <motion.span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#9FE8D0' }}
            animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1.25, 0.9] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/60">
            How It Works
          </span>
        </div>
        <span className="text-[10px] font-mono text-white/40 tracking-wider">
          3-STEP FIELD FLOW
        </span>
      </div>

      {/* Glass step stack with animated scanline */}
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-2.5 space-y-2 overflow-hidden">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-12 -top-12"
          style={{
            background:
              'linear-gradient(180deg, transparent, rgba(159,232,208,0.07), transparent)',
          }}
          animate={{ y: ['0%', '800%'] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'linear' }}
        />

        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.65,
                delay: 1.45 + idx * 0.14,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ scale: 1.015, backgroundColor: 'rgba(255,255,255,0.06)' }}
              className="relative flex items-start gap-3 rounded-xl p-2.5 border border-white/[0.07] bg-white/[0.025] transition"
            >
              {/* Step badge + pulsing icon */}
              <div className="relative flex-shrink-0">
                <motion.div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10"
                  style={{ background: 'rgba(10,10,20,0.75)' }}
                  animate={{
                    borderColor: [
                      'rgba(255,255,255,0.10)',
                      step.accent === '#FFE2AA'
                        ? 'rgba(255,226,170,0.45)'
                        : 'rgba(159,232,208,0.45)',
                      'rgba(255,255,255,0.10)',
                    ],
                  }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    delay: idx * 0.9,
                    ease: 'easeInOut',
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: step.accent }} />
                </motion.div>
                <span
                  className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold leading-none border border-white/15"
                  style={{ background: '#0a0a14', color: step.accent }}
                >
                  {step.num}
                </span>
              </div>

              {/* Copy */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white font-bold text-[13px] leading-snug">
                    {step.title}
                  </span>
                  <span
                    className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] flex-shrink-0"
                    style={{ color: step.accent }}
                  >
                    {step.tag}
                  </span>
                </div>
                <p className="text-white/65 text-[11.5px] leading-relaxed mt-0.5">
                  {step.detail}
                </p>
              </div>
            </motion.div>
          );
        })}

        {/* Bottom live status bar */}
        <div className="flex items-center justify-between px-2 pt-1 text-[10px] font-mono text-white/50">
          <span className="flex items-center gap-1.5">
            <motion.span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#FFE2AA' }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            OFFLINE-READY HUD
          </span>
          <span className="inline-flex items-center gap-0.5 text-[#9FE8D0]">
            5 free scans / mo <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.section>
  );
}