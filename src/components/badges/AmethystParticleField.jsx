/**
 * AmethystParticleField — magical purple particle system for badge unlocks.
 *
 * Layers:
 *   1. Pulsing amethyst glow aura (radial, breathing)
 *   2. Orbiting crystal motes (circular trajectories, variable speed)
 *   3. Rising sparkle particles (drift upward, twinkle, fade)
 *   4. Shimmer flash bursts (occasional cross-shaped sparkles)
 */
import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const AMETHYST_COLORS = [
  'hsla(280,100%,75%,0.9)',  // bright amethyst glow
  'hsla(270,90%,85%,0.8)',   // pale lavender
  'hsla(265,80%,65%,0.85)',  // deep amethyst
  'hsla(290,100%,80%,0.75)', // pink-violet shimmer
];

function pick(arr, i) {
  return arr[i % arr.length];
}

export function generateOrbiters(intensity) {
  return Array.from({ length: Math.round(14 * intensity) }, (_, i) => ({
    angle: (i / 14) * Math.PI * 2,
    radius: 90 + Math.random() * 60,
    speed: 6 + Math.random() * 8,
    size: 1.5 + Math.random() * 2.5,
    color: pick(AMETHYST_COLORS, i),
    delay: Math.random() * 3,
    direction: Math.random() > 0.5 ? 1 : -1,
  }));
}

export function generateRisers(intensity) {
  return Array.from({ length: Math.round(10 * intensity) }, (_, i) => ({
    x: 15 + Math.random() * 70,
    startY: 70 + Math.random() * 25,
    drift: -15 + Math.random() * 30,
    size: 1 + Math.random() * 2,
    dur: 4 + Math.random() * 5,
    delay: Math.random() * 4,
    color: pick(AMETHYST_COLORS, i + 2),
  }));
}

export function generateShimmers(intensity) {
  return Array.from({ length: Math.round(5 * intensity) }, () => ({
    x: 20 + Math.random() * 60,
    y: 20 + Math.random() * 60,
    size: 4 + Math.random() * 6,
    dur: 2.5 + Math.random() * 3,
    delay: Math.random() * 4,
  }));
}

function PulsingAura({ size, reduceMotion }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size * 0.85,
        height: size * 0.85,
        left: '7.5%',
        top: '7.5%',
        background: 'radial-gradient(circle, hsla(280,100%,70%,0.22) 0%, hsla(270,80%,50%,0.08) 40%, transparent 70%)',
        filter: 'blur(16px)',
      }}
      animate={reduceMotion ? { scale: 1, opacity: 0.7 } : { scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
      transition={reduceMotion ? { duration: 0 } : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function OrbiterMote({ mote, center }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: mote.size,
        height: mote.size,
        background: mote.color,
        boxShadow: `0 0 ${mote.size * 4}px ${mote.color}, 0 0 ${mote.size * 8}px ${mote.color.replace(/[\d.]+\)$/, '0.3)')}`,
        left: center,
        top: center,
        marginLeft: -mote.size / 2,
        marginTop: -mote.size / 2,
      }}
      animate={{
        x: [
          Math.cos(mote.angle) * mote.radius,
          Math.cos(mote.angle + Math.PI * 2 * mote.direction) * mote.radius,
          Math.cos(mote.angle) * mote.radius,
        ],
        y: [
          Math.sin(mote.angle) * mote.radius,
          Math.sin(mote.angle + Math.PI * 2 * mote.direction) * mote.radius,
          Math.sin(mote.angle) * mote.radius,
        ],
        opacity: [0.4, 1, 0.4],
      }}
      transition={{
        duration: mote.speed,
        delay: mote.delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

function RisingSparkle({ sparkle }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: sparkle.size,
        height: sparkle.size,
        background: sparkle.color,
        boxShadow: `0 0 ${sparkle.size * 5}px ${sparkle.color}`,
        left: `${sparkle.x}%`,
        top: `${sparkle.startY}%`,
      }}
      animate={{
        y: [0, -120, -160],
        x: [0, sparkle.drift, sparkle.drift * 0.5],
        opacity: [0, 1, 0],
        scale: [0.5, 1.2, 0.3],
      }}
      transition={{
        duration: sparkle.dur,
        delay: sparkle.delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  );
}

function ShimmerFlash({ shimmer }) {
  return (
    <motion.div
      className="absolute"
      style={{
        left: `${shimmer.x}%`,
        top: `${shimmer.y}%`,
        width: shimmer.size,
        height: shimmer.size,
      }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1.5, 0],
        rotate: [0, 90, 180],
      }}
      transition={{
        duration: shimmer.dur,
        delay: shimmer.delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: shimmer.size * 3,
        height: 1,
        transform: 'translate(-50%, -50%)',
        background: 'linear-gradient(90deg, transparent, hsla(280,100%,90%,0.9), transparent)',
        boxShadow: '0 0 4px hsla(280,100%,80%,0.8)',
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 1,
        height: shimmer.size * 3,
        transform: 'translate(-50%, -50%)',
        background: 'linear-gradient(180deg, transparent, hsla(280,100%,90%,0.9), transparent)',
        boxShadow: '0 0 4px hsla(280,100%,80%,0.8)',
      }} />
    </motion.div>
  );
}

export default function AmethystParticleField({ intensity = 1, size = 320 }) {
  const reduceMotion = useReducedMotion();
  const orbiters = useMemo(() => reduceMotion ? [] : generateOrbiters(intensity), [intensity, reduceMotion]);
  const risers = useMemo(() => reduceMotion ? [] : generateRisers(intensity), [intensity, reduceMotion]);
  const shimmers = useMemo(() => reduceMotion ? [] : generateShimmers(intensity), [intensity, reduceMotion]);

  const center = size / 2;

  return (
    <div
      className="absolute pointer-events-none"
      style={{ width: size, height: size, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
    >
      <PulsingAura size={size} reduceMotion={reduceMotion} />

      {orbiters.map((o, i) => (
        <OrbiterMote key={`orbit-${i}`} mote={o} center={center} />
      ))}

      {risers.map((r, i) => (
        <RisingSparkle key={`rise-${i}`} sparkle={r} />
      ))}

      {shimmers.map((s, i) => (
        <ShimmerFlash key={`shimmer-${i}`} shimmer={s} />
      ))}
    </div>
  );
}
