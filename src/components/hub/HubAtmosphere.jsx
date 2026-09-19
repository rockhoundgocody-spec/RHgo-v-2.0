import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import useReducedMotion from '@/lib/useReducedMotion';

/** Cinematic Hub backdrop — aurora, grid, drifting motes. */
export default function HubAtmosphere() {
  const reduce = useReducedMotion();
  const motes = useMemo(
    () => Array.from({ length: reduce ? 0 : 18 }, (_, i) => ({
      id: i,
      left: `${(i * 37) % 100}%`,
      top: `${(i * 53) % 70}%`,
      size: 1.5 + (i % 3),
      delay: (i % 7) * 0.4,
      duration: 4 + (i % 5),
    })),
    [reduce],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="hub-aurora" />
      <div className="hub-aurora hub-aurora-secondary" />
      <div className="hub-grid" />
      <div className="hub-vignette" />
      <div className="hub-scanline" />
      {motes.map((m) => (
        <motion.div
          key={m.id}
          className="absolute rounded-full"
          style={{
            left: m.left,
            top: m.top,
            width: m.size,
            height: m.size,
            background: iColor(m.id),
            boxShadow: `0 0 ${6 + m.size * 2}px ${iColor(m.id)}`,
          }}
          animate={{ opacity: [0.15, 0.85, 0.15], y: [0, -14, 0] }}
          transition={{ duration: m.duration, delay: m.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function iColor(i) {
  const colors = [
    'hsla(280,100%,75%,0.9)',
    'hsla(190,100%,70%,0.85)',
    'hsla(160,90%,70%,0.8)',
    'hsla(320,90%,75%,0.75)',
  ];
  return colors[i % colors.length];
}
