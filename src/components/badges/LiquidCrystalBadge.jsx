/**
 * LiquidCrystalBadge — Legacy compatibility shim
 * Delegates to the new LiquidMineralBadge renderer.
 * Existing imports of LiquidCrystalBadge continue to work.
 */
import React from 'react';
import LiquidMineralBadge from './LiquidMineralBadge.jsx';

// Map legacy props → new badge shape
export default function LiquidCrystalBadge({ rarity = 'common', icon = 'Gem', size = 80, locked = false, isNew = false }) {
  const badge = {
    code: 'legacy',
    title: '',
    rarity,
    icon,
    material: 'crystal_core',
    colorScheme:
      rarity === 'legendary' ? 'gold'
      : rarity === 'epic'    ? 'amethyst'
      : rarity === 'rare'    ? 'violet'
      : rarity === 'uncommon'? 'emerald'
      : 'slate',
  };
  return <LiquidMineralBadge badge={badge} size={size} locked={locked} />;
}