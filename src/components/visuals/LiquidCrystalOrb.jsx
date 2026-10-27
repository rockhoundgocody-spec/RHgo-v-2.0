import React, { useEffect, useRef } from 'react';
import createOrbScene from '@/components/visuals/orbScene';
import attachOrbMotion from '@/components/visuals/orbMotion';
import '@/components/visuals/liquidCrystalOrb.css';

export default function LiquidCrystalOrb({ size = 144, field = false }) {
  const host = useRef(null);
  const canvas = useRef(null);
  useEffect(() => {
    const scene = createOrbScene(canvas.current, field);
    if (!scene) return;
    return attachOrbMotion(host.current, canvas.current, scene);
  }, [field]);
  return (
    <div ref={host} aria-hidden="true" data-orb-renderer="fallback"
      className={field ? 'liquid-crystal-scene liquid-crystal-field' : 'liquid-crystal-scene'}
      style={field ? undefined : { width: size, height: size }}>
      <div className="liquid-crystal-fallback" />
      <canvas ref={canvas} className="absolute inset-0 block h-full w-full" />
    </div>
  );
}