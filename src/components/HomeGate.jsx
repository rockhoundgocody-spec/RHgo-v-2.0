import React, { Suspense } from 'react';

const Hub = React.lazy(() => import('@/pages/Hub'));

/**
 * HomeGate — open entry on `/`.
 * Everyone (signed-in or guest) goes straight into the Hub with Clover,
 * with no login wall or registration gate.
 */
export default function HomeGate() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#0a0a14' }} />}>
      <Hub />
    </Suspense>
  );
}