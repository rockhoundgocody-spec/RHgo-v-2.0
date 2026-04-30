import React from 'react';
import { useOracle } from './OracleContext.jsx';
import LiquidGlassShader from '@/components/visuals/LiquidGlassShader.jsx';

export default function FloatingOracleButton() {
  const { open, toggleOracle } = useOracle();
  if (open) return null;
  return (
    <button
      onClick={toggleOracle}
      aria-label="Open Oracle"
      className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full overflow-hidden border border-amethyst-glow/40 shadow-[0_0_30px_hsla(280,100%,60%,0.55),inset_0_0_20px_hsla(265,90%,30%,0.6)] animate-amethyst-pulse hover:scale-105 transition"
    >
      <LiquidGlassShader hue={0.78} intensity={1.05} speed={0.25} />
      <span className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 32% 28%, hsla(0,0%,100%,0.5) 0%, hsla(0,0%,100%,0) 35%)',
        }}
      />
    </button>
  );
}