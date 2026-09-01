import React, { Suspense } from 'react';

// Lazy-loaded AmethystOrb — the same WebGPU black-opal shader orb used on
// the Hub, so the intro and the Hub show the exact same companion.
const AmethystOrb = React.lazy(() => import('@/components/visuals/AmethystOrb.jsx'));

/**
 * IntroOrb — the companion orb used during the intro cinematics.
 * Wraps the real AmethystOrb (identical to the Hub orb) so the intro and the
 * Hub show the same physical form. `speaking` drives the orb's speaking state.
 */
export default function IntroOrb({ size = 130, speaking = false }) {
  return (
    <Suspense fallback={<div style={{ width: size, height: size }} />}>
      <AmethystOrb size={size} orbState={speaking ? 'speaking' : 'idle'} level={1} />
    </Suspense>
  );
}