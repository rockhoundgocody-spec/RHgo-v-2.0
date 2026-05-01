import React, { useState, useRef } from 'react';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';
import WaterRipple from '@/components/visuals/WaterRipple.jsx';
import { useOracle } from '@/components/oracle/OracleContext.jsx';

export default function HeroOrb() {
  const { openOracle } = useOracle();
  const [ripples, setRipples] = useState([]);
  const containerRef = useRef(null);

  const handleTap = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : 130;
    const y = rect ? e.clientY - rect.top : 130;
    const id = Date.now() + Math.random();
    setRipples((r) => [...r, { id, x, y }]);
    openOracle({ live: true });
  };

  const removeRipple = (id) =>
    setRipples((r) => r.filter((rp) => rp.id !== id));

  return (
    <div className="relative flex flex-col items-center animate-hero-breathe">
      <style>{`
        @keyframes hero-breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.06); }
        }
        .animate-hero-breathe { animation: hero-breathe 5s ease-in-out infinite; }
      `}</style>
      {/* concave shadow ring beneath orb */}
      <div
        className="absolute -bottom-4 w-48 h-8 rounded-[50%] blur-2xl opacity-60 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse, hsla(280,100%,50%,0.45) 0%, transparent 70%)',
        }}
      />
      <div className="relative" ref={containerRef}>
        <button
          onClick={handleTap}
          aria-label="Talk to the Amethyst Oracle"
          className="rounded-full transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-amethyst-glow/60"
        >
          <AmethystOrb size={169} />
        </button>

        {ripples.map((r) => (
          <WaterRipple
            key={r.id}
            x={r.x}
            y={r.y}
            onDone={() => removeRipple(r.id)}
          />
        ))}
      </div>
    </div>
  );
}