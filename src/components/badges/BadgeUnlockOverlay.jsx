/**
 * BadgeUnlockOverlay — Legacy shim.
 * Routes to the new BadgeUnlockAnimation component.
 */
import React from 'react';
import BadgeUnlockAnimation from './BadgeUnlockAnimation.jsx';

export default function BadgeUnlockOverlay({ badge, onClose }) {
  // Ensure badge has colorScheme + material if coming from old definitions
  if (!badge) return null;
  const enriched = {
    colorScheme: 'amethyst',
    material: 'crystal_core',
    ...badge,
  };
  return <BadgeUnlockAnimation badge={enriched} onClose={onClose} />;
}