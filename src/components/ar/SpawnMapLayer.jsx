/**
 * SpawnMapLayer — floating spawn pins + heat-map rings over the Explore map.
 * Rendered as absolutely-positioned DOM overlay (not Leaflet) for performance.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'legendary'];

export function calculateSpawnPosition(index, totalSpawns, rarity) {
  const rarityIdx = RARITY_ORDER.indexOf(rarity);
  const safeRarityIdx = rarityIdx >= 0 ? rarityIdx : 0;
  const angle = totalSpawns > 0 ? (index / totalSpawns) * 2 * Math.PI : 0;
  const radius = 28 + safeRarityIdx * 8;
  const x = 50 + Math.cos(angle) * radius;
  const y = 48 + Math.sin(angle) * radius;
  return { x, y, rarityIdx: safeRarityIdx };
}

export function getPinSize(rarity) {
  if (rarity === 'legendary') return 46;
  if (rarity === 'rare') return 40;
  return 34;
}

export function DailyCapBanner() {
  return (
    <div
      className="absolute top-28 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{
        background: 'hsla(0,60%,20%,0.9)',
        border: '1px solid hsla(0,80%,50%,0.4)',
        color: 'hsl(0,80%,70%)'
      }}
    >
      Daily cap reached — returns tomorrow
    </div>
  );
}

export function HeatRings() {
  return (
    <>
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full"
        style={{
          width: 280,
          height: 280,
          border: '1px solid hsla(280,80%,60%,0.12)',
          background: 'radial-gradient(circle, hsla(280,80%,60%,0.04) 0%, transparent 70%)'
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full"
        style={{
          width: 180,
          height: 180,
          border: '1px solid hsla(195,100%,60%,0.1)',
          animation: 'badge-pulse-glow 4s ease-in-out infinite'
        }}
      />
    </>
  );
}

export function SpawnTooltip({ spawn }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="absolute bottom-full mb-2 px-2.5 py-1.5 rounded-xl text-center whitespace-nowrap pointer-events-none z-10"
      style={{
        background: 'hsla(240,30%,8%,0.95)',
        border: `1px solid ${spawn.color}44`,
        minWidth: 100
      }}
    >
      <div className="text-[11px] font-bold text-white">{spawn.mineral_name}</div>
      <div className="flex items-center justify-center gap-1 mt-0.5">
        <Zap size={9} style={{ color: spawn.color }} />
        <span className="text-[9px] font-bold" style={{ color: spawn.color }}>
          +{spawn.xp} XP
        </span>
        {spawn.is_shiny && <span className="text-[9px] text-yellow-300">✨</span>}
      </div>
    </motion.div>
  );
}

export function SpawnPin({ spawn, index, totalSpawns, cappedOut, onSpawnTap }) {
  const [isHovered, setIsHovered] = useState(false);
  const { x, y, rarityIdx } = calculateSpawnPosition(index, totalSpawns, spawn.rarity);
  const pinSize = getPinSize(spawn.rarity);

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', damping: 18 }}
      onClick={() => !cappedOut && onSpawnTap && onSpawnTap(spawn)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto flex flex-col items-center gap-1"
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-label={`Spawn: ${spawn.mineral_name || 'Mineral'} (${spawn.rarity || 'common'})`}
    >
      {/* Glow ring */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${spawn.glow} 0%, transparent 65%)`,
          width: 48,
          height: 48,
          transform: 'translate(-50%, -50%) translate(50%, 50%)',
          animation: `badge-pulse-glow ${2.5 + rarityIdx * 0.3}s ease-in-out infinite`,
          animationDelay: `${index * 0.2}s`
        }}
      />

      {/* Pin */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 2 + index * 0.15, ease: 'easeInOut' }}
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: pinSize,
          height: pinSize,
          background: `radial-gradient(circle at 35% 30%, ${spawn.color}dd, ${spawn.color}55)`,
          border: `2px solid ${spawn.color}`,
          boxShadow: `0 0 ${spawn.rarity === 'legendary' ? 20 : 10}px ${spawn.glow}`,
          filter: cappedOut ? 'grayscale(0.8) brightness(0.5)' : 'none'
        }}
      >
        <span className="text-lg select-none" role="img">{spawn.emoji}</span>
        {spawn.is_shiny && (
          <div
            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
            style={{ background: 'hsl(45,100%,55%)', fontSize: 8 }}
          >
            ✨
          </div>
        )}
      </motion.div>

      {/* Tooltip on hover */}
      <AnimatePresence>
        {isHovered && <SpawnTooltip spawn={spawn} />}
      </AnimatePresence>

      {/* Rarity label */}
      <div className="text-[7px] font-bold uppercase tracking-wider" style={{ color: spawn.color }}>
        {spawn.rarity}
      </div>
    </motion.button>
  );
}

export default function SpawnMapLayer({ spawns = [], onSpawnTap, caughtToday, dailyCap }) {
  if (!spawns.length) return null;

  const cappedOut = caughtToday >= dailyCap;

  return (
    <div className="absolute inset-0 pointer-events-none z-[800]">
      {cappedOut && <DailyCapBanner />}

      {spawns.map((spawn, i) => (
        <SpawnPin
          key={spawn.id}
          spawn={spawn}
          index={i}
          totalSpawns={spawns.length}
          cappedOut={cappedOut}
          onSpawnTap={onSpawnTap}
        />
      ))}

      <HeatRings />
    </div>
  );
}
