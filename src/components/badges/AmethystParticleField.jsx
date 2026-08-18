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
import { motion } from 'framer-motion';

const AMETHYST_COLORS = [
  'hsla(280,100%,75%,0.9)',  // bright amethyst glow
  'hsla(270,90%,85%,0.8)',   // pale lavender
  'hsla(265,80%,65%,0.85)',  // deep amethyst
  'hsla(290,100%,80%,0.75)', // pink-violet shimmer
];

function pick(arr, i) { return arr[i % arr.length]; }

function PulsingAura({ size }) {
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
      animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function OrbiterParticle({ orbiter, center }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: orbiter.size,
        height: orbiter.size,
        background: orbiter.color,
        boxShadow: `0 0 ${orbiter.size * 4}px ${orbiter.color}, 0 0 ${orbiter.size * 8}px ${orbiter.color.replace(/[\d.]+\)$/, '0.3)')}`,
        left: center,
        top: center,
        marginLeft: -orbiter.size / 2,
        marginTop: -orbiter.size / 2,
      }}
      animate={{
        x: [
          Math.cos(orbiter.angle) * orbiter.radius,
          Math.cos(orbiter.angle + Math.PI * 2 * orbiter.direction) * orbiter.radius,
          Math.cos(orbiter.angle) * orbiter.radius,
        ],
        y: [
          Math.sin(orbiter.angle) * orbiter.radius,
          Math.sin(orbiter.angle + Math.PI * 2 * orbiter.direction) * orbiter.radius,
          Math.sin(orbiter.angle) * orbiter.radius,
        ],
        opacity: [0.4, 1, 0.4],
      }}
      transition={{
        duration: orbiter.speed,
        delay: orbiter.delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

function RisingSparkle({ particle }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: particle.size,
        height: particle.size,
        background: particle.color,
        boxShadow: `0 0 ${particle.size * 5}px ${particle.color}`,
        left: `${particle.x}%`,
        top: `${particle.startY}%`,
      }}
      animate={{
        y: [0, -120, -160],
        x: [0, particle.drift, particle.drift * 0.5],
        opacity: [0, 1, 0],
        scale: [0.5, 1.2, 0.3],
      }}
      transition={{
        duration: particle.dur,
        delay: particle.delay,
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
  // Orbiting motes — circle the badge at various radii/speeds
  const orbiters = useMemo(() =>
    Array.from({ length: Math.round(14 * intensity) }, (_, i) => ({
      angle: (i / 14) * Math.PI * 2,
      radius: 90 + Math.random() * 60,
      speed: 6 + Math.random() * 8,
      size: 1.5 + Math.random() * 2.5,
      color: pick(AMETHYST_COLORS, i),
      delay: Math.random() * 3,
      direction: Math.random() > 0.5 ? 1 : -1,
    })), [intensity]);

  // Rising sparkles — drift upward from bottom, twinkle, fade
  const risers = useMemo(() =>
    Array.from({ length: Math.round(10 * intensity) }, (_, i) => ({
      x: 15 + Math.random() * 70,
      startY: 70 + Math.random() * 25,
      drift: -15 + Math.random() * 30,
      size: 1 + Math.random() * 2,
      dur: 4 + Math.random() * 5,
      delay: Math.random() * 4,
      color: pick(AMETHYST_COLORS, i + 2),
    })), [intensity]);

  // Shimmer flashes — occasional 4-point star sparkles
  const shimmers = useMemo(() =>
    Array.from({ length: Math.round(5 * intensity) }, () => ({
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      size: 4 + Math.random() * 6,
      dur: 2.5 + Math.random() * 3,
      delay: Math.random() * 4,
    })), [intensity]);

  const center = size / 2;

  return (
    <div
      className="absolute pointer-events-none"
      style={{ width: size, height: size, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
    >
      <PulsingAura size={size} />

      {orbiters.map((o, i) => (
        <OrbiterParticle key={`orbit-${i}`} orbiter={o} center={center} />
      ))}

      {risers.map((r, i) => (
        <RisingSparkle key={`rise-${i}`} particle={r} />
      ))}

      {shimmers.map((s, i) => (
        <ShimmerFlash key={`shimmer-${i}`} shimmer={s} />
      ))}
    </div>
  );
}
