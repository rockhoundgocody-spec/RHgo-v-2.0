/**
 * IntroCinematic — plays once on first app launch.
 * AI-generated crystal video background with animated text overlays.
 * Tap anywhere or wait for video to end to skip.
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VIDEO_URL = 'https://media.base44.com/videos/public/69f35dd14650b54681c835ec/a133d0438_generated_video.mp4';

const LINES = [
  { text: 'The earth is hiding something…',  delay: 0.6,  duration: 2.0 },
  { text: 'Every rock has a story.',          delay: 2.8,  duration: 2.0 },
  { text: 'Are you ready to find yours?',     delay: 4.6,  duration: 2.4 },
];

export default function IntroCinematic({ onDone }) {
  const [phase, setPhase] = useState('intro');
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef(null);

  // Auto-advance fallback (in case video hangs or is slow)
  useEffect(() => {
    const t = setTimeout(() => setPhase('outro'), 9000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase === 'outro') {
      const t = setTimeout(onDone, 700);
      return () => clearTimeout(t);
    }
  }, [phase, onDone]);

  const handleVideoEnded = () => setPhase('outro');

  return (
    <AnimatePresence>
      {phase === 'intro' && (
        <motion.div
          key="cinematic"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-end overflow-hidden cursor-pointer select-none"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          onClick={() => setPhase('outro')}
        >
          {/* Video background — covers full screen, object-cover */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            src={VIDEO_URL}
            autoPlay
            playsInline
            muted
            onEnded={handleVideoEnded}
            onCanPlay={() => setVideoReady(true)}
          />

          {/* Dark gradient overlay for text legibility */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, hsla(255,30%,8%,0.5) 0%, hsla(255,30%,6%,0.2) 40%, hsla(255,30%,5%,0.75) 75%, hsla(250,30%,4%,0.95) 100%)',
            }}
          />

          {/* Ambient purple bloom */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 40%, hsla(280,100%,50%,0.12) 0%, transparent 60%)',
            }}
          />

          {/* Loading shimmer before video loads */}
          {!videoReady && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 0.2 }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
              style={{ background: 'radial-gradient(ellipse at 50% 40%, hsl(270 50% 15%) 0%, hsl(245 25% 5%) 100%)' }}
            >
              <div className="w-10 h-10 border-2 border-amethyst/20 border-t-amethyst-glow rounded-full animate-spin" />
            </motion.div>
          )}

          {/* Content — anchored to bottom third for cinematic feel */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 pb-16 w-full max-w-sm">
            {/* Story lines */}
            <div className="flex flex-col items-center gap-3 mb-8 min-h-[80px]">
              {LINES.map(({ text, delay, duration }) => (
                <motion.p
                  key={text}
                  initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                  animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -4], filter: ['blur(4px)', 'blur(0px)', 'blur(0px)', 'blur(2px)'] }}
                  transition={{
                    delay,
                    duration: duration + 0.5,
                    times: [0, 0.15, 0.75, 1],
                    ease: 'easeInOut',
                  }}
                  className="text-white/70 text-[15px] leading-relaxed font-light"
                  style={{ letterSpacing: '0.03em' }}
                >
                  {text}
                </motion.p>
              ))}
            </div>

            {/* App name — appears last */}
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 6.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <div className="text-[10px] uppercase tracking-[0.5em] text-white/35 mb-2 font-semibold">
                Built by collectors · for collectors
              </div>
              <div
                className="text-5xl font-black text-white"
                style={{
                  letterSpacing: '-0.02em',
                  textShadow: '0 0 60px hsla(280,100%,75%,0.7), 0 0 120px hsla(265,80%,50%,0.4)',
                }}
              >
                RockHound
                <span style={{ color: 'hsl(280,100%,88%)' }}> GO</span>
              </div>
            </motion.div>
          </div>

          {/* Skip hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="absolute bottom-4 text-white/20 text-[10px] tracking-[0.3em] uppercase z-10"
          >
            Tap to skip
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}