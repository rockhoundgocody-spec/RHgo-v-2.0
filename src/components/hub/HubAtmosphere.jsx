import React from 'react';

/** Lightweight cinematic backdrop for the Hub — no WebGL. */
export default function HubAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="hub-aurora" />
      <div className="hub-grid" />
      <div className="hub-vignette" />
    </div>
  );
}
